alter system set max_replication_slots = 5;
create publication supabase_realtime for all tables;
