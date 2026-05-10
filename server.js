const express = require('express');
const axios = require('axios');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'sf-validation-manager-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// ─── Salesforce OAuth Config ──────────────────────────────────────────────────
const SF_CLIENT_ID = process.env.SF_CLIENT_ID;
const SF_CLIENT_SECRET = process.env.SF_CLIENT_SECRET;
const SF_REDIRECT_URI =
  process.env.SF_REDIRECT_URI || 'http://localhost:5000/auth/callback';
const SF_LOGIN_URL =
  process.env.SF_LOGIN_URL || 'https://login.salesforce.com';

// ─── Salesforce Login Route ───────────────────────────────────────────────────
app.get('/auth/login', (req, res) => {
  const codeVerifier = crypto.randomBytes(64).toString('base64url');

  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  req.session.codeVerifier = codeVerifier;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SF_CLIENT_ID,
    redirect_uri: SF_REDIRECT_URI,
    scope: 'api refresh_token offline_access',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: crypto.randomBytes(16).toString('hex')
  });

  res.redirect(
    `${SF_LOGIN_URL}/services/oauth2/authorize?${params.toString()}`
  );
});

// ─── Salesforce OAuth Callback ────────────────────────────────────────────────
app.get('/auth/callback', async (req, res) => {
  const { code, error } = req.query;
  const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:3000';

  if (error) {
    console.error('Salesforce returned OAuth error:', error);
    return res.redirect(`${FRONTEND}?error=${error}`);
  }

  try {
    const codeVerifier = req.session.codeVerifier;

    if (!codeVerifier) {
      console.error('No code verifier found in session');
      return res.redirect(`${FRONTEND}?error=missing_verifier`);
    }

    const tokenRes = await axios.post(
      `${SF_LOGIN_URL}/services/oauth2/token`,
      null,
      {
        params: {
          grant_type: 'authorization_code',
          client_id: SF_CLIENT_ID,
          client_secret: SF_CLIENT_SECRET,
          redirect_uri: SF_REDIRECT_URI,
          code,
          code_verifier: codeVerifier
        }
      }
    );

    const {
      access_token,
      refresh_token,
      instance_url,
      id
    } = tokenRes.data;

    const userRes = await axios.get(id, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    req.session.sf = {
      access_token,
      refresh_token,
      instance_url,
      user: {
        name: userRes.data.display_name,
        email: userRes.data.email,
        username: userRes.data.username,
        org_id: userRes.data.organization_id,
        user_id: userRes.data.user_id
      }
    };

    delete req.session.codeVerifier;

    console.log('Salesforce OAuth success for:', userRes.data.username);

    return res.redirect(`${FRONTEND}?login=success`);

  } catch (err) {
    console.error(
      'Full OAuth error:',
      JSON.stringify(err.response?.data, null, 2)
    );
    console.error('Message:', err.message);

    return res.redirect(`${FRONTEND}?error=oauth_failed`);
  }
});

// ─── Logout ───────────────────────────────────────────────────────────────────
app.post('/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// ─── Auth Middleware ──────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session.sf) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  next();
}

// ─── Helper: Normalize Rules Payload ──────────────────────────────────────────
function normalizeRulesPayload(rawRules) {
  let rules = rawRules;

  // Case 1: frontend sent { rules: [...] }
  if (
    Array.isArray(rules) &&
    rules.length === 1 &&
    rules[0] &&
    typeof rules[0] === 'object' &&
    Array.isArray(rules[0].rules)
  ) {
    rules = rules[0].rules;
  }

  // Case 2: frontend sent single object
  else if (!Array.isArray(rules)) {
    if (rules && typeof rules === 'object') {
      // If object contains nested rules array
      if (Array.isArray(rules.rules)) {
        rules = rules.rules;
      } else {
        rules = [rules];
      }
    } else {
      return null;
    }
  }

  return rules;
}

// ─── Helper: Validate Rules ───────────────────────────────────────────────────
function validateRules(rules) {
  return rules.filter(
    rule =>
      !rule ||
      typeof rule !== 'object' ||
      !rule.id ||
      typeof rule.active === 'undefined'
  );
}

// ─── Current User Session ─────────────────────────────────────────────────────
app.get('/api/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.session.sf.user,
    instance_url: req.session.sf.instance_url
  });
});

// ─── Validation Rules List ────────────────────────────────────────────────────
app.get('/api/validation-rules', requireAuth, async (req, res) => {
  const { access_token, instance_url } = req.session.sf;

  try {
    const query = `
      SELECT Id, ValidationName, Active, Description, ErrorMessage,
             ErrorDisplayField, EntityDefinitionId, NamespacePrefix,
             CreatedDate, LastModifiedDate
      FROM ValidationRule
      WHERE EntityDefinition.QualifiedApiName = 'Account'
      ORDER BY ValidationName
    `;

    const response = await axios.get(
      `${instance_url}/services/data/v59.0/tooling/query`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`
        },
        params: {
          q: query
        }
      }
    );

    res.json({
      success: true,
      totalSize: response.data.totalSize,
      rules: response.data.records
    });

  } catch (err) {
    console.error(
      'Fetch rules error:',
      err.response?.data || err.message
    );

    res.status(500).json({
      success: false,
      error: 'Failed to fetch validation rules'
    });
  }
});

// ─── Update Validation Rule Active State ──────────────────────────────────────
async function updateRuleActiveState(instance_url, access_token, id, active) {
  try {
    console.log(`\n--- Fetching metadata for rule: ${id} ---`);

    if (!id) {
      throw new Error('Rule ID is missing');
    }

    const getRes = await axios.get(
      `${instance_url}/services/data/v59.0/tooling/sobjects/ValidationRule/${id}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }
    );

    const currentMetadata = getRes.data.Metadata;

    if (!currentMetadata) {
      throw new Error(`No metadata returned for rule ${id}`);
    }

    const patchBody = {
      Metadata: {
        ...currentMetadata,
        active: active
      }
    };

    console.log(
      'Sending PATCH with body:',
      JSON.stringify(patchBody, null, 2)
    );

    await axios.patch(
      `${instance_url}/services/data/v59.0/tooling/sobjects/ValidationRule/${id}`,
      patchBody,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`Rule ${id} updated successfully to active=${active}`);

  } catch (err) {
    console.error('=== ERROR in updateRuleActiveState ===');
    console.error('Rule ID:', id);
    console.error('Active:', active);
    console.error('Error message:', err.message);
    console.error('Response status:', err.response?.status);
    console.error(
      'Response data:',
      JSON.stringify(err.response?.data, null, 2)
    );

    throw err;
  }
}

// ─── Toggle Single Rule ───────────────────────────────────────────────────────
app.patch('/api/validation-rules/:id', requireAuth, async (req, res) => {
  const { access_token, instance_url } = req.session.sf;
  const { id } = req.params;
  const { active } = req.body;

  try {
    if (typeof active === 'undefined') {
      return res.status(400).json({
        success: false,
        error: 'active field is required'
      });
    }

    await updateRuleActiveState(
      instance_url,
      access_token,
      id,
      active
    );

    res.json({
      success: true,
      message: `Rule ${
        active ? 'activated' : 'deactivated'
      } successfully`
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.response?.data || err.message
    });
  }
});

// ─── Bulk Toggle Rules ────────────────────────────────────────────────────────
app.patch('/api/validation-rules', requireAuth, async (req, res) => {
  const { access_token, instance_url } = req.session.sf;

  let rules = normalizeRulesPayload(req.body.rules || req.body);

  if (!rules) {
    return res.status(400).json({
      success: false,
      error: 'Invalid rules payload. Expected rules array.'
    });
  }

  const invalidRules = validateRules(rules);

  if (invalidRules.length > 0) {
    console.error(
      'Invalid rules payload received:',
      JSON.stringify(rules, null, 2)
    );

    return res.status(400).json({
      success: false,
      error: 'Each rule must include valid id and active fields.',
      received: rules
    });
  }

  try {
    const results = await Promise.allSettled(
      rules.map(({ id, active }) =>
        updateRuleActiveState(
          instance_url,
          access_token,
          id,
          active
        )
      )
    );

    res.json({
      success: true,
      results: results.map((r, i) => ({
        id: rules[i].id,
        success: r.status === 'fulfilled',
        error:
          r.status === 'rejected'
            ? r.reason?.response?.data || r.reason?.message
            : null
      }))
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Bulk update failed'
    });
  }
});

// ─── Deploy Rules ─────────────────────────────────────────────────────────────
app.post('/api/deploy', requireAuth, async (req, res) => {
  const { access_token, instance_url } = req.session.sf;

  let rules = normalizeRulesPayload(req.body.rules || req.body);

  if (!rules) {
    return res.status(400).json({
      success: false,
      error: 'Invalid rules payload. Expected rules array.'
    });
  }

  const invalidRules = validateRules(rules);

  if (invalidRules.length > 0) {
    console.error(
      'Invalid rules payload received:',
      JSON.stringify(rules, null, 2)
    );

    return res.status(400).json({
      success: false,
      error: 'Each rule must include valid id and active fields.',
      received: rules
    });
  }

  try {
    const results = await Promise.allSettled(
      rules.map(({ id, active }) =>
        updateRuleActiveState(
          instance_url,
          access_token,
          id,
          active
        )
      )
    );

    const failed = results.filter(
      r => r.status === 'rejected'
    );

    const succeeded = results.filter(
      r => r.status === 'fulfilled'
    );

    console.log(
      `Deploy: ${succeeded.length} succeeded, ${failed.length} failed`
    );

    if (failed.length > 0) {
      return res.status(207).json({
        success: false,
        message: `${failed.length} rule(s) failed, ${succeeded.length} succeeded`,
        results: results.map((r, i) => ({
          id: rules[i].id,
          success: r.status === 'fulfilled',
          error:
            r.status === 'rejected'
              ? r.reason?.response?.data || r.reason?.message
              : null
        }))
      });
    }

    res.json({
      success: true,
      message: `${rules.length} rule(s) deployed to Salesforce successfully`
    });

  } catch (err) {
    console.error(
      'Deploy error:',
      err.response?.data || err.message
    );

    res.status(500).json({
      success: false,
      error: err.response?.data || err.message
    });
  }
});

// ─── Production Build ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));

  app.get('*', (req, res) => {
    res.sendFile(
      path.join(__dirname, 'build', 'index.html')
    );
  });
}

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});