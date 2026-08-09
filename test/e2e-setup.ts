// Must run before any test module is loaded so AppModule picks up MOCK_AUTH_ENABLED.
process.env.MOCK_AUTH_ENABLED = 'true';
