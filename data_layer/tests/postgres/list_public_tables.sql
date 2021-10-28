-- List all public tables. We use this to check created tables by setup.
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
