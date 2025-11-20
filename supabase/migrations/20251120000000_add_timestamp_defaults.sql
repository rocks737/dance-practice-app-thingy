-- Add default values for created_at and updated_at columns
-- This allows inserts without explicitly setting these values

-- Set default for created_at on all tables
ALTER TABLE abuse_reports ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE abuse_reports ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE abuse_reports ALTER COLUMN version SET DEFAULT 0;

ALTER TABLE locations ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE locations ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE locations ALTER COLUMN version SET DEFAULT 0;

ALTER TABLE schedule_preferences ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE schedule_preferences ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE schedule_preferences ALTER COLUMN version SET DEFAULT 0;

ALTER TABLE session_notes ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE session_notes ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE session_notes ALTER COLUMN version SET DEFAULT 0;

ALTER TABLE sessions ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE sessions ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE sessions ALTER COLUMN version SET DEFAULT 0;

ALTER TABLE user_profiles ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE user_profiles ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE user_profiles ALTER COLUMN version SET DEFAULT 0;

-- Create a function to automatically update the updated_at timestamp
-- This will override any value provided by the client
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a function to enforce created_at and updated_at on INSERT
-- This will override any value provided by the client
CREATE OR REPLACE FUNCTION set_timestamps_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = now();
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to enforce timestamps on INSERT (override any client values)
CREATE TRIGGER set_abuse_reports_timestamps BEFORE INSERT ON abuse_reports
    FOR EACH ROW EXECUTE FUNCTION set_timestamps_on_insert();

CREATE TRIGGER set_locations_timestamps BEFORE INSERT ON locations
    FOR EACH ROW EXECUTE FUNCTION set_timestamps_on_insert();

CREATE TRIGGER set_schedule_preferences_timestamps BEFORE INSERT ON schedule_preferences
    FOR EACH ROW EXECUTE FUNCTION set_timestamps_on_insert();

CREATE TRIGGER set_session_notes_timestamps BEFORE INSERT ON session_notes
    FOR EACH ROW EXECUTE FUNCTION set_timestamps_on_insert();

CREATE TRIGGER set_sessions_timestamps BEFORE INSERT ON sessions
    FOR EACH ROW EXECUTE FUNCTION set_timestamps_on_insert();

CREATE TRIGGER set_user_profiles_timestamps BEFORE INSERT ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION set_timestamps_on_insert();

-- Create triggers to automatically update updated_at on UPDATE
CREATE TRIGGER update_abuse_reports_updated_at BEFORE UPDATE ON abuse_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_preferences_updated_at BEFORE UPDATE ON schedule_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_notes_updated_at BEFORE UPDATE ON session_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


