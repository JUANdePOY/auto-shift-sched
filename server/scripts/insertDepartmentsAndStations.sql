-- Insert Production Department and Stations
INSERT INTO departments (name) VALUES ('Production');
SET @production_id = LAST_INSERT_ID();
INSERT INTO stations (name, departmentId) VALUES 
('Batch Grill', @production_id),
('Initiator', @production_id),
('Assembler', @production_id),
('Prepping', @production_id),
('Chicken Expert', @production_id);

-- Insert Service Department and Stations
INSERT INTO departments (name) VALUES ('Service');
SET @service_id = LAST_INSERT_ID();
INSERT INTO stations (name, departmentId) VALUES 
('Fries Person', @service_id),
('Drive Thru', @service_id),
('Presenter', @service_id),
('Table Server', @service_id),
('CA/CR', @service_id),
('Others', @service_id);
