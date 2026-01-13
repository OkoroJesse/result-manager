-- RPC to reload PostgREST schema cache
-- This allows the client to force a refresh after migrations
CREATE OR REPLACE FUNCTION reload_schema_cache() 
RETURNS void AS $$ 
BEGIN
    NOTIFY pgrst, 'reload config'; 
END; 
$$ LANGUAGE plpgsql;
