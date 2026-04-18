-- Sync catalog structure to match ProBuild_Final_Product_Catalog.xlsx
UPDATE public.products SET main_category_id = NULL, subcategory_id = NULL;
DELETE FROM public.catalog_subcategories;
DELETE FROM public.catalog_main_categories;

-- Ensure leaf categories used by products exist
INSERT INTO public.categories (name, icon, display_order)
VALUES ('Abrasives & Grinding', 'Package', 10)
ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, icon, display_order)
VALUES ('Adhesives, Sealants & Lubricants', 'Package', 20)
ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, icon, display_order)
VALUES ('Bearings & Seals', 'Package', 30)
ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, icon, display_order)
VALUES ('Building & Raw Materials', 'Package', 40)
ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, icon, display_order)
VALUES ('Drill Bits & Cutters', 'Package', 50)
ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, icon, display_order)
VALUES ('Electrical & Testing Tools', 'Package', 60)
ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, icon, display_order)
VALUES ('Fasteners & Hardware', 'Package', 70)
ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, icon, display_order)
VALUES ('Hand Tools', 'Package', 80)
ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, icon, display_order)
VALUES ('Hydraulic Tools & Jacks', 'Package', 90)
ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, icon, display_order)
VALUES ('Lifting & Rigging', 'Package', 100)
ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, icon, display_order)
VALUES ('Machine Spares & Miscellaneous', 'Package', 110)
ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, icon, display_order)
VALUES ('Measuring & Layout Tools', 'Package', 120)
ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, icon, display_order)
VALUES ('Pipes, Fittings & Valves', 'Package', 130)
ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, icon, display_order)
VALUES ('Pneumatic & Air Tools', 'Package', 140)
ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, icon, display_order)
VALUES ('Power Tools', 'Package', 150)
ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, icon, display_order)
VALUES ('Safety Equipment', 'Package', 160)
ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, icon, display_order)
VALUES ('Sockets & Socket Sets', 'Package', 170)
ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, icon, display_order)
VALUES ('Spanners & Wrenches', 'Package', 180)
ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order;

INSERT INTO public.categories (name, icon, display_order)
VALUES ('Welding & Gas Cutting', 'Package', 190)
ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order;

-- Insert main categories from Excel
INSERT INTO public.catalog_main_categories (name, slug, description, image_url, display_order, is_active)
VALUES ('Fasteners & Hardware', 'fasteners-and-hardware', 'Allen Bolts, Hex Bolts, Nuts, Washers, Studs, Rivets', '', 10, true);

INSERT INTO public.catalog_main_categories (name, slug, description, image_url, display_order, is_active)
VALUES ('Metalworking & Fabrication', 'metalworking-and-fabrication', 'Drill Bits, Taps, Dies, End Mills, Cutting & Grinding Wheels', '', 20, true);

INSERT INTO public.catalog_main_categories (name, slug, description, image_url, display_order, is_active)
VALUES ('Hand Tools', 'hand-tools', 'Spanners, Pliers, Hammers, Chisels, Files, Vices', '', 30, true);

INSERT INTO public.catalog_main_categories (name, slug, description, image_url, display_order, is_active)
VALUES ('Building & Grounds Maintenance', 'building-and-grounds-maintenance', 'MS Rods, Steel Sheets, Anchors, General Hardware', '', 40, true);

INSERT INTO public.catalog_main_categories (name, slug, description, image_url, display_order, is_active)
VALUES ('Tools & Test Instruments', 'tools-and-test-instruments', 'Grinders, Drill Machines, Welding Machines, Power Tools', '', 50, true);

INSERT INTO public.catalog_main_categories (name, slug, description, image_url, display_order, is_active)
VALUES ('Sockets & Drive Tools', 'sockets-and-drive-tools', 'Impact Sockets, Socket Sets, Ratchets, Extensions', '', 60, true);

INSERT INTO public.catalog_main_categories (name, slug, description, image_url, display_order, is_active)
VALUES ('Pneumatics & Hydraulics', 'pneumatics-and-hydraulics', 'Air Tools, Fittings, PU Pipes, Jacks, Gauges', '', 70, true);

INSERT INTO public.catalog_main_categories (name, slug, description, image_url, display_order, is_active)
VALUES ('Lighting & Electrical', 'lighting-and-electrical', 'Multimeters, Testers, Screwdrivers, Allen Keys, Cables', '', 80, true);

INSERT INTO public.catalog_main_categories (name, slug, description, image_url, display_order, is_active)
VALUES ('Motors & Power Transmission', 'motors-and-power-transmission', 'Bearings, Seals, Belts, Armatures, Carbon Brushes', '', 90, true);

INSERT INTO public.catalog_main_categories (name, slug, description, image_url, display_order, is_active)
VALUES ('Tapes, Adhesives & Lubricants', 'tapes-adhesives-and-lubricants', 'Araldite, Loctite, Silicone, WD-40, Grease, Tapes', '', 100, true);

INSERT INTO public.catalog_main_categories (name, slug, description, image_url, display_order, is_active)
VALUES ('Lifting & Material Handling', 'lifting-and-material-handling', 'Chain Blocks, Slings, Hooks, Chains, Ropes', '', 110, true);

INSERT INTO public.catalog_main_categories (name, slug, description, image_url, display_order, is_active)
VALUES ('Measuring & Precision Tools', 'measuring-and-precision-tools', 'Calipers, Micrometers, Levels, Tapes, Laser Meters', '', 120, true);

INSERT INTO public.catalog_main_categories (name, slug, description, image_url, display_order, is_active)
VALUES ('Safety & Security', 'safety-and-security', 'Helmets, Harness, Shoes, Gloves, Eye & Fire Protection', '', 130, true);

INSERT INTO public.catalog_main_categories (name, slug, description, image_url, display_order, is_active)
VALUES ('Pipes, Hose & Fittings', 'pipes-hose-and-fittings', 'Valves, Hose Pipes, PVC Pipes, Clamps, Fittings', '', 140, true);

INSERT INTO public.catalog_main_categories (name, slug, description, image_url, display_order, is_active)
VALUES ('Packaging & Shipping', 'packaging-and-shipping', 'Stretch Films, Packaging Materials', '', 150, true);

-- Insert subcategories from Excel
INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'General Hardware & Miscellaneous', 'general-hardware-and-miscellaneous', '', '', 'Machine Spares & Miscellaneous', 10, true
FROM public.catalog_main_categories
WHERE name = 'Building & Grounds Maintenance';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'MS Rods & Steel Bars', 'ms-rods-and-steel-bars', '', '', 'Building & Raw Materials', 20, true
FROM public.catalog_main_categories
WHERE name = 'Building & Grounds Maintenance';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Buckets & Containers', 'buckets-and-containers', '', '', 'Building & Raw Materials', 30, true
FROM public.catalog_main_categories
WHERE name = 'Building & Grounds Maintenance';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Steel Sheets & Plates', 'steel-sheets-and-plates', '', '', 'Building & Raw Materials', 40, true
FROM public.catalog_main_categories
WHERE name = 'Building & Grounds Maintenance';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Chemical Anchors & Fixings', 'chemical-anchors-and-fixings', '', '', 'Building & Raw Materials', 50, true
FROM public.catalog_main_categories
WHERE name = 'Building & Grounds Maintenance';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Agricultural Equipment', 'agricultural-equipment', '', '', 'Building & Raw Materials', 60, true
FROM public.catalog_main_categories
WHERE name = 'Building & Grounds Maintenance';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Hex Bolts & Screws', 'hex-bolts-and-screws', '', '', 'Fasteners & Hardware', 70, true
FROM public.catalog_main_categories
WHERE name = 'Fasteners & Hardware';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Allen Bolts (Socket Cap Screws)', 'allen-bolts-socket-cap-screws', '', '', 'Fasteners & Hardware', 80, true
FROM public.catalog_main_categories
WHERE name = 'Fasteners & Hardware';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Nuts (Hex, Nylock, Flange, Dome)', 'nuts-hex-nylock-flange-dome', '', '', 'Fasteners & Hardware', 90, true
FROM public.catalog_main_categories
WHERE name = 'Fasteners & Hardware';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'CSK & Countersunk Bolts', 'csk-and-countersunk-bolts', '', '', 'Fasteners & Hardware', 100, true
FROM public.catalog_main_categories
WHERE name = 'Fasteners & Hardware';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Washers (Flat, Spring, Lock)', 'washers-flat-spring-lock', '', '', 'Fasteners & Hardware', 110, true
FROM public.catalog_main_categories
WHERE name = 'Fasteners & Hardware';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Studs & Threaded Rods', 'studs-and-threaded-rods', '', '', 'Fasteners & Hardware', 120, true
FROM public.catalog_main_categories
WHERE name = 'Fasteners & Hardware';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Foundation & Anchor Bolts', 'foundation-and-anchor-bolts', '', '', 'Fasteners & Hardware', 130, true
FROM public.catalog_main_categories
WHERE name = 'Fasteners & Hardware';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Self Drilling Screws', 'self-drilling-screws', '', '', 'Fasteners & Hardware', 140, true
FROM public.catalog_main_categories
WHERE name = 'Fasteners & Hardware';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Rivets & Pop Rivets', 'rivets-and-pop-rivets', '', '', 'Fasteners & Hardware', 150, true
FROM public.catalog_main_categories
WHERE name = 'Fasteners & Hardware';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Ring Spanners', 'ring-spanners', '', '', 'Spanners & Wrenches', 160, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Open End Spanners', 'open-end-spanners', '', '', 'Spanners & Wrenches', 170, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Chisels & Punches', 'chisels-and-punches', '', '', 'Hand Tools', 180, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Combination Spanners', 'combination-spanners', '', '', 'Spanners & Wrenches', 190, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Hammers & Mallets', 'hammers-and-mallets', '', '', 'Hand Tools', 200, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Pullers & Extractors', 'pullers-and-extractors', '', '', 'Spanners & Wrenches', 210, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Box & Tubular Spanners', 'box-and-tubular-spanners', '', '', 'Spanners & Wrenches', 220, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Pipe Wrenches', 'pipe-wrenches', '', '', 'Spanners & Wrenches', 230, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Bench Vices & Clamps', 'bench-vices-and-clamps', '', '', 'Hand Tools', 240, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Files & Rasps', 'files-and-rasps', '', '', 'Hand Tools', 250, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Circlip Pliers', 'circlip-pliers', '', '', 'Hand Tools', 260, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Cutting Pliers & Cable Cutters', 'cutting-pliers-and-cable-cutters', '', '', 'Hand Tools', 270, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Slugging & Heavy Spanners', 'slugging-and-heavy-spanners', '', '', 'Spanners & Wrenches', 280, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Specialty Hand Tools', 'specialty-hand-tools', '', '', 'Hand Tools', 290, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Filter Wrenches', 'filter-wrenches', '', '', 'Spanners & Wrenches', 300, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Wheel & Lug Spanners', 'wheel-and-lug-spanners', '', '', 'Spanners & Wrenches', 310, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Wire Strippers & Crimpers', 'wire-strippers-and-crimpers', '', '', 'Hand Tools', 320, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Wood Chisels', 'wood-chisels', '', '', 'Hand Tools', 330, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Adjustable Wrenches', 'adjustable-wrenches', '', '', 'Hand Tools', 340, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Combination Pliers', 'combination-pliers', '', '', 'Hand Tools', 350, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Hacksaw Blades', 'hacksaw-blades', '', '', 'Hand Tools', 360, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Masonry & Trowel Tools', 'masonry-and-trowel-tools', '', '', 'Hand Tools', 370, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Squares & Layout Tools', 'squares-and-layout-tools', '', '', 'Hand Tools', 380, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Tin Snips & Sheet Cutters', 'tin-snips-and-sheet-cutters', '', '', 'Hand Tools', 390, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Torque Wrenches', 'torque-wrenches', '', '', 'Spanners & Wrenches', 400, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Utility Knives & Blades', 'utility-knives-and-blades', '', '', 'Hand Tools', 410, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Specialty Spanners', 'specialty-spanners', '', '', 'Spanners & Wrenches', 420, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Water Pump & Slip Joint Pliers', 'water-pump-and-slip-joint-pliers', '', '', 'Hand Tools', 430, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Hacksaws & Frames', 'hacksaws-and-frames', '', '', 'Hand Tools', 440, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Locking & Grip Pliers', 'locking-and-grip-pliers', '', '', 'Hand Tools', 450, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Long Nose & Needle Nose Pliers', 'long-nose-and-needle-nose-pliers', '', '', 'Hand Tools', 460, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Caulking & Sealant Guns', 'caulking-and-sealant-guns', '', '', 'Hand Tools', 470, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Tool Storage & Boxes', 'tool-storage-and-boxes', '', '', 'Hand Tools', 480, true
FROM public.catalog_main_categories
WHERE name = 'Hand Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Hooks & Shackles', 'hooks-and-shackles', '', '', 'Lifting & Rigging', 490, true
FROM public.catalog_main_categories
WHERE name = 'Lifting & Material Handling';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Pins & Cotter Pins', 'pins-and-cotter-pins', '', '', 'Lifting & Rigging', 500, true
FROM public.catalog_main_categories
WHERE name = 'Lifting & Material Handling';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Lifting Slings & Web Belts', 'lifting-slings-and-web-belts', '', '', 'Lifting & Rigging', 510, true
FROM public.catalog_main_categories
WHERE name = 'Lifting & Material Handling';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Chain Blocks & Hoists', 'chain-blocks-and-hoists', '', '', 'Lifting & Rigging', 520, true
FROM public.catalog_main_categories
WHERE name = 'Lifting & Material Handling';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Industrial Chains', 'industrial-chains', '', '', 'Lifting & Rigging', 530, true
FROM public.catalog_main_categories
WHERE name = 'Lifting & Material Handling';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Chain Pulleys & Trolleys', 'chain-pulleys-and-trolleys', '', '', 'Lifting & Rigging', 540, true
FROM public.catalog_main_categories
WHERE name = 'Lifting & Material Handling';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Ropes & Wire Ropes', 'ropes-and-wire-ropes', '', '', 'Lifting & Rigging', 550, true
FROM public.catalog_main_categories
WHERE name = 'Lifting & Material Handling';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Ratchet Straps & Tie Downs', 'ratchet-straps-and-tie-downs', '', '', 'Lifting & Rigging', 560, true
FROM public.catalog_main_categories
WHERE name = 'Lifting & Material Handling';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Allen Keys & Hex Keys', 'allen-keys-and-hex-keys', '', '', 'Electrical & Testing Tools', 570, true
FROM public.catalog_main_categories
WHERE name = 'Lighting & Electrical';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Insulated Screwdrivers', 'insulated-screwdrivers', '', '', 'Electrical & Testing Tools', 580, true
FROM public.catalog_main_categories
WHERE name = 'Lighting & Electrical';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Voltage & Line Testers', 'voltage-and-line-testers', '', '', 'Electrical & Testing Tools', 590, true
FROM public.catalog_main_categories
WHERE name = 'Lighting & Electrical';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Multimeters', 'multimeters', '', '', 'Electrical & Testing Tools', 600, true
FROM public.catalog_main_categories
WHERE name = 'Lighting & Electrical';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Screwdriver Bits', 'screwdriver-bits', '', '', 'Electrical & Testing Tools', 610, true
FROM public.catalog_main_categories
WHERE name = 'Lighting & Electrical';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Cables & Wiring', 'cables-and-wiring', '', '', 'Electrical & Testing Tools', 620, true
FROM public.catalog_main_categories
WHERE name = 'Lighting & Electrical';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Clamp Meters', 'clamp-meters', '', '', 'Electrical & Testing Tools', 630, true
FROM public.catalog_main_categories
WHERE name = 'Lighting & Electrical';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Electrical Accessories', 'electrical-accessories', '', '', 'Electrical & Testing Tools', 640, true
FROM public.catalog_main_categories
WHERE name = 'Lighting & Electrical';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Soldering Equipment', 'soldering-equipment', '', '', 'Electrical & Testing Tools', 650, true
FROM public.catalog_main_categories
WHERE name = 'Lighting & Electrical';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Crimping & Wire Tools', 'crimping-and-wire-tools', '', '', 'Electrical & Testing Tools', 660, true
FROM public.catalog_main_categories
WHERE name = 'Lighting & Electrical';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Insulation Testers', 'insulation-testers', '', '', 'Electrical & Testing Tools', 670, true
FROM public.catalog_main_categories
WHERE name = 'Lighting & Electrical';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Measuring Tapes & Rules', 'measuring-tapes-and-rules', '', '', 'Measuring & Layout Tools', 680, true
FROM public.catalog_main_categories
WHERE name = 'Measuring & Precision Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Dividers & Compasses', 'dividers-and-compasses', '', '', 'Measuring & Layout Tools', 690, true
FROM public.catalog_main_categories
WHERE name = 'Measuring & Precision Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Feeler & Taper Gauges', 'feeler-and-taper-gauges', '', '', 'Measuring & Layout Tools', 700, true
FROM public.catalog_main_categories
WHERE name = 'Measuring & Precision Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Specialty Measurement Tools', 'specialty-measurement-tools', '', '', 'Measuring & Layout Tools', 710, true
FROM public.catalog_main_categories
WHERE name = 'Measuring & Precision Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Digital Calipers', 'digital-calipers', '', '', 'Measuring & Layout Tools', 720, true
FROM public.catalog_main_categories
WHERE name = 'Measuring & Precision Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Micrometers', 'micrometers', '', '', 'Measuring & Layout Tools', 730, true
FROM public.catalog_main_categories
WHERE name = 'Measuring & Precision Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Spirit Levels', 'spirit-levels', '', '', 'Measuring & Layout Tools', 740, true
FROM public.catalog_main_categories
WHERE name = 'Measuring & Precision Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Vernier Calipers', 'vernier-calipers', '', '', 'Measuring & Layout Tools', 750, true
FROM public.catalog_main_categories
WHERE name = 'Measuring & Precision Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Laser Distance Meters', 'laser-distance-meters', '', '', 'Measuring & Layout Tools', 760, true
FROM public.catalog_main_categories
WHERE name = 'Measuring & Precision Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Welding Gauges', 'welding-gauges', '', '', 'Measuring & Layout Tools', 770, true
FROM public.catalog_main_categories
WHERE name = 'Measuring & Precision Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Diagnostic Tools', 'diagnostic-tools', '', '', 'Measuring & Layout Tools', 780, true
FROM public.catalog_main_categories
WHERE name = 'Measuring & Precision Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Dial Indicators & Gauges', 'dial-indicators-and-gauges', '', '', 'Measuring & Layout Tools', 790, true
FROM public.catalog_main_categories
WHERE name = 'Measuring & Precision Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Height Gauges', 'height-gauges', '', '', 'Measuring & Layout Tools', 800, true
FROM public.catalog_main_categories
WHERE name = 'Measuring & Precision Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'HSS Drill Bits (Parallel Shank)', 'hss-drill-bits-parallel-shank', '', '', 'Drill Bits & Cutters', 810, true
FROM public.catalog_main_categories
WHERE name = 'Metalworking & Fabrication';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Taps & Dies (Threading)', 'taps-and-dies-threading', '', '', 'Drill Bits & Cutters', 820, true
FROM public.catalog_main_categories
WHERE name = 'Metalworking & Fabrication';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'SDS & Hammer Drill Bits', 'sds-and-hammer-drill-bits', '', '', 'Drill Bits & Cutters', 830, true
FROM public.catalog_main_categories
WHERE name = 'Metalworking & Fabrication';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Taper Shank Drill Bits', 'taper-shank-drill-bits', '', '', 'Drill Bits & Cutters', 840, true
FROM public.catalog_main_categories
WHERE name = 'Metalworking & Fabrication';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Hole Saws', 'hole-saws', '', '', 'Drill Bits & Cutters', 850, true
FROM public.catalog_main_categories
WHERE name = 'Metalworking & Fabrication';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Emery Cloth & Sandpaper', 'emery-cloth-and-sandpaper', '', '', 'Abrasives & Grinding', 860, true
FROM public.catalog_main_categories
WHERE name = 'Metalworking & Fabrication';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Annular Cutters (TCT)', 'annular-cutters-tct', '', '', 'Drill Bits & Cutters', 870, true
FROM public.catalog_main_categories
WHERE name = 'Metalworking & Fabrication';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'End Mills & Milling Cutters', 'end-mills-and-milling-cutters', '', '', 'Drill Bits & Cutters', 880, true
FROM public.catalog_main_categories
WHERE name = 'Metalworking & Fabrication';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Drill Chucks & Accessories', 'drill-chucks-and-accessories', '', '', 'Drill Bits & Cutters', 890, true
FROM public.catalog_main_categories
WHERE name = 'Metalworking & Fabrication';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Lathe Tool Bits', 'lathe-tool-bits', '', '', 'Drill Bits & Cutters', 900, true
FROM public.catalog_main_categories
WHERE name = 'Metalworking & Fabrication';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Cutting Wheels & Discs', 'cutting-wheels-and-discs', '', '', 'Abrasives & Grinding', 910, true
FROM public.catalog_main_categories
WHERE name = 'Metalworking & Fabrication';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Diamond & CBN Wheels', 'diamond-and-cbn-wheels', '', '', 'Abrasives & Grinding', 920, true
FROM public.catalog_main_categories
WHERE name = 'Metalworking & Fabrication';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Grinding Wheels', 'grinding-wheels', '', '', 'Abrasives & Grinding', 930, true
FROM public.catalog_main_categories
WHERE name = 'Metalworking & Fabrication';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Core Drill Bits', 'core-drill-bits', '', '', 'Drill Bits & Cutters', 940, true
FROM public.catalog_main_categories
WHERE name = 'Metalworking & Fabrication';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Specialty Cutters', 'specialty-cutters', '', '', 'Drill Bits & Cutters', 950, true
FROM public.catalog_main_categories
WHERE name = 'Metalworking & Fabrication';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Wire Brushes & Cup Wheels', 'wire-brushes-and-cup-wheels', '', '', 'Abrasives & Grinding', 960, true
FROM public.catalog_main_categories
WHERE name = 'Metalworking & Fabrication';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Dressing Tools & Stones', 'dressing-tools-and-stones', '', '', 'Abrasives & Grinding', 970, true
FROM public.catalog_main_categories
WHERE name = 'Metalworking & Fabrication';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Saw Blades (Wood)', 'saw-blades-wood', '', '', 'Abrasives & Grinding', 980, true
FROM public.catalog_main_categories
WHERE name = 'Metalworking & Fabrication';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Step & Spade Drill Bits', 'step-and-spade-drill-bits', '', '', 'Drill Bits & Cutters', 990, true
FROM public.catalog_main_categories
WHERE name = 'Metalworking & Fabrication';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Band Saw Blades', 'band-saw-blades', '', '', 'Abrasives & Grinding', 1000, true
FROM public.catalog_main_categories
WHERE name = 'Metalworking & Fabrication';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Diamond Blades (Marble & Tile)', 'diamond-blades-marble-and-tile', '', '', 'Abrasives & Grinding', 1010, true
FROM public.catalog_main_categories
WHERE name = 'Metalworking & Fabrication';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Flap Discs & Flap Wheels', 'flap-discs-and-flap-wheels', '', '', 'Abrasives & Grinding', 1020, true
FROM public.catalog_main_categories
WHERE name = 'Metalworking & Fabrication';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Non-Woven Abrasives & Pads', 'non-woven-abrasives-and-pads', '', '', 'Abrasives & Grinding', 1030, true
FROM public.catalog_main_categories
WHERE name = 'Metalworking & Fabrication';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Oil Seals & Shaft Seals', 'oil-seals-and-shaft-seals', '', '', 'Bearings & Seals', 1040, true
FROM public.catalog_main_categories
WHERE name = 'Motors & Power Transmission';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Carbon Brushes', 'carbon-brushes', '', '', 'Machine Spares & Miscellaneous', 1050, true
FROM public.catalog_main_categories
WHERE name = 'Motors & Power Transmission';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Gland Packing & PTFE', 'gland-packing-and-ptfe', '', '', 'Bearings & Seals', 1060, true
FROM public.catalog_main_categories
WHERE name = 'Motors & Power Transmission';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Power Tool Armatures', 'power-tool-armatures', '', '', 'Machine Spares & Miscellaneous', 1070, true
FROM public.catalog_main_categories
WHERE name = 'Motors & Power Transmission';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Power Tool Field Coils', 'power-tool-field-coils', '', '', 'Machine Spares & Miscellaneous', 1080, true
FROM public.catalog_main_categories
WHERE name = 'Motors & Power Transmission';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'V-Belts & Poly Belts', 'v-belts-and-poly-belts', '', '', 'Bearings & Seals', 1090, true
FROM public.catalog_main_categories
WHERE name = 'Motors & Power Transmission';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Ball & Roller Bearings', 'ball-and-roller-bearings', '', '', 'Bearings & Seals', 1100, true
FROM public.catalog_main_categories
WHERE name = 'Motors & Power Transmission';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Circlips & Retaining Rings', 'circlips-and-retaining-rings', '', '', 'Bearings & Seals', 1110, true
FROM public.catalog_main_categories
WHERE name = 'Motors & Power Transmission';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Power Tool Spare Parts', 'power-tool-spare-parts', '', '', 'Machine Spares & Miscellaneous', 1120, true
FROM public.catalog_main_categories
WHERE name = 'Motors & Power Transmission';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Gaskets & Rubber Products', 'gaskets-and-rubber-products', '', '', 'Bearings & Seals', 1130, true
FROM public.catalog_main_categories
WHERE name = 'Motors & Power Transmission';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Stretch Films & Wraps', 'stretch-films-and-wraps', '', '', 'Machine Spares & Miscellaneous', 1140, true
FROM public.catalog_main_categories
WHERE name = 'Packaging & Shipping';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Industrial Hose Pipes', 'industrial-hose-pipes', '', '', 'Pipes, Fittings & Valves', 1150, true
FROM public.catalog_main_categories
WHERE name = 'Pipes, Hose & Fittings';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'PVC & Braided Hose Pipes', 'pvc-and-braided-hose-pipes', '', '', 'Pipes, Fittings & Valves', 1160, true
FROM public.catalog_main_categories
WHERE name = 'Pipes, Hose & Fittings';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Gate Valves', 'gate-valves', '', '', 'Pipes, Fittings & Valves', 1170, true
FROM public.catalog_main_categories
WHERE name = 'Pipes, Hose & Fittings';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Pipe Fittings & Adaptors', 'pipe-fittings-and-adaptors', '', '', 'Pipes, Fittings & Valves', 1180, true
FROM public.catalog_main_categories
WHERE name = 'Pipes, Hose & Fittings';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Ball Valves', 'ball-valves', '', '', 'Pipes, Fittings & Valves', 1190, true
FROM public.catalog_main_categories
WHERE name = 'Pipes, Hose & Fittings';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Pipe Tools & Accessories', 'pipe-tools-and-accessories', '', '', 'Pipes, Fittings & Valves', 1200, true
FROM public.catalog_main_categories
WHERE name = 'Pipes, Hose & Fittings';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Washing & Spray Accessories', 'washing-and-spray-accessories', '', '', 'Pipes, Fittings & Valves', 1210, true
FROM public.catalog_main_categories
WHERE name = 'Pipes, Hose & Fittings';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Hose Clamps & Clips', 'hose-clamps-and-clips', '', '', 'Pipes, Fittings & Valves', 1220, true
FROM public.catalog_main_categories
WHERE name = 'Pipes, Hose & Fittings';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'High Pressure Hoses', 'high-pressure-hoses', '', '', 'Pipes, Fittings & Valves', 1230, true
FROM public.catalog_main_categories
WHERE name = 'Pipes, Hose & Fittings';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Pressure Regulators', 'pressure-regulators', '', '', 'Pipes, Fittings & Valves', 1240, true
FROM public.catalog_main_categories
WHERE name = 'Pipes, Hose & Fittings';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Pneumatic Push Fittings', 'pneumatic-push-fittings', '', '', 'Pneumatic & Air Tools', 1250, true
FROM public.catalog_main_categories
WHERE name = 'Pneumatics & Hydraulics';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Hydraulic Jacks & Lifts', 'hydraulic-jacks-and-lifts', '', '', 'Hydraulic Tools & Jacks', 1260, true
FROM public.catalog_main_categories
WHERE name = 'Pneumatics & Hydraulics';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'PU Tubes & Air Hoses', 'pu-tubes-and-air-hoses', '', '', 'Pneumatic & Air Tools', 1270, true
FROM public.catalog_main_categories
WHERE name = 'Pneumatics & Hydraulics';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Quick Release Couplings', 'quick-release-couplings', '', '', 'Pneumatic & Air Tools', 1280, true
FROM public.catalog_main_categories
WHERE name = 'Pneumatics & Hydraulics';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Pneumatic Spare Kits', 'pneumatic-spare-kits', '', '', 'Pneumatic & Air Tools', 1290, true
FROM public.catalog_main_categories
WHERE name = 'Pneumatics & Hydraulics';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Pneumatic Valves & Controls', 'pneumatic-valves-and-controls', '', '', 'Pneumatic & Air Tools', 1300, true
FROM public.catalog_main_categories
WHERE name = 'Pneumatics & Hydraulics';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Air Compressors', 'air-compressors', '', '', 'Pneumatic & Air Tools', 1310, true
FROM public.catalog_main_categories
WHERE name = 'Pneumatics & Hydraulics';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Pressure & Vacuum Gauges', 'pressure-and-vacuum-gauges', '', '', 'Pneumatic & Air Tools', 1320, true
FROM public.catalog_main_categories
WHERE name = 'Pneumatics & Hydraulics';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Air Blow Guns', 'air-blow-guns', '', '', 'Pneumatic & Air Tools', 1330, true
FROM public.catalog_main_categories
WHERE name = 'Pneumatics & Hydraulics';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'FRL Units & Air Prep', 'frl-units-and-air-prep', '', '', 'Pneumatic & Air Tools', 1340, true
FROM public.catalog_main_categories
WHERE name = 'Pneumatics & Hydraulics';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Air Impact Wrenches', 'air-impact-wrenches', '', '', 'Pneumatic & Air Tools', 1350, true
FROM public.catalog_main_categories
WHERE name = 'Pneumatics & Hydraulics';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Safety Shoes & Boots', 'safety-shoes-and-boots', '', '', 'Safety Equipment', 1360, true
FROM public.catalog_main_categories
WHERE name = 'Safety & Security';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Work & Safety Gloves', 'work-and-safety-gloves', '', '', 'Safety Equipment', 1370, true
FROM public.catalog_main_categories
WHERE name = 'Safety & Security';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Welding Safety', 'welding-safety', '', '', 'Safety Equipment', 1380, true
FROM public.catalog_main_categories
WHERE name = 'Safety & Security';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Safety Harness & Belts', 'safety-harness-and-belts', '', '', 'Safety Equipment', 1390, true
FROM public.catalog_main_categories
WHERE name = 'Safety & Security';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Eye & Face Protection', 'eye-and-face-protection', '', '', 'Safety Equipment', 1400, true
FROM public.catalog_main_categories
WHERE name = 'Safety & Security';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Work Clothing & PPE', 'work-clothing-and-ppe', '', '', 'Safety Equipment', 1410, true
FROM public.catalog_main_categories
WHERE name = 'Safety & Security';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Fire Safety Equipment', 'fire-safety-equipment', '', '', 'Safety Equipment', 1420, true
FROM public.catalog_main_categories
WHERE name = 'Safety & Security';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Safety Clothing & PPE', 'safety-clothing-and-ppe', '', '', 'Safety Equipment', 1430, true
FROM public.catalog_main_categories
WHERE name = 'Safety & Security';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Safety Helmets & Hard Hats', 'safety-helmets-and-hard-hats', '', '', 'Safety Equipment', 1440, true
FROM public.catalog_main_categories
WHERE name = 'Safety & Security';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Hearing Protection', 'hearing-protection', '', '', 'Safety Equipment', 1450, true
FROM public.catalog_main_categories
WHERE name = 'Safety & Security';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'High Visibility Clothing', 'high-visibility-clothing', '', '', 'Safety Equipment', 1460, true
FROM public.catalog_main_categories
WHERE name = 'Safety & Security';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Respiratory Protection', 'respiratory-protection', '', '', 'Safety Equipment', 1470, true
FROM public.catalog_main_categories
WHERE name = 'Safety & Security';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Hex & Deep Sockets', 'hex-and-deep-sockets', '', '', 'Sockets & Socket Sets', 1480, true
FROM public.catalog_main_categories
WHERE name = 'Sockets & Drive Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Impact Sockets', 'impact-sockets', '', '', 'Sockets & Socket Sets', 1490, true
FROM public.catalog_main_categories
WHERE name = 'Sockets & Drive Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Torx & Star Sockets', 'torx-and-star-sockets', '', '', 'Sockets & Socket Sets', 1500, true
FROM public.catalog_main_categories
WHERE name = 'Sockets & Drive Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Allen & Hex Sockets', 'allen-and-hex-sockets', '', '', 'Sockets & Socket Sets', 1510, true
FROM public.catalog_main_categories
WHERE name = 'Sockets & Drive Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Extension Bars & Adaptors', 'extension-bars-and-adaptors', '', '', 'Sockets & Socket Sets', 1520, true
FROM public.catalog_main_categories
WHERE name = 'Sockets & Drive Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Socket Sets (Complete)', 'socket-sets-complete', '', '', 'Sockets & Socket Sets', 1530, true
FROM public.catalog_main_categories
WHERE name = 'Sockets & Drive Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Specialty Sockets', 'specialty-sockets', '', '', 'Sockets & Socket Sets', 1540, true
FROM public.catalog_main_categories
WHERE name = 'Sockets & Drive Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'T-Handles & L-Handles', 't-handles-and-l-handles', '', '', 'Sockets & Socket Sets', 1550, true
FROM public.catalog_main_categories
WHERE name = 'Sockets & Drive Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Ratchet Handles & Drives', 'ratchet-handles-and-drives', '', '', 'Sockets & Socket Sets', 1560, true
FROM public.catalog_main_categories
WHERE name = 'Sockets & Drive Tools';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Epoxy Adhesives', 'epoxy-adhesives', '', '', 'Adhesives, Sealants & Lubricants', 1570, true
FROM public.catalog_main_categories
WHERE name = 'Tapes, Adhesives & Lubricants';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Electrical & PVC Tapes', 'electrical-and-pvc-tapes', '', '', 'Adhesives, Sealants & Lubricants', 1580, true
FROM public.catalog_main_categories
WHERE name = 'Tapes, Adhesives & Lubricants';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Grease Guns & Dispensers', 'grease-guns-and-dispensers', '', '', 'Adhesives, Sealants & Lubricants', 1590, true
FROM public.catalog_main_categories
WHERE name = 'Tapes, Adhesives & Lubricants';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Industrial Grease & Lubricants', 'industrial-grease-and-lubricants', '', '', 'Adhesives, Sealants & Lubricants', 1600, true
FROM public.catalog_main_categories
WHERE name = 'Tapes, Adhesives & Lubricants';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Threadlockers & Retaining Compounds', 'threadlockers-and-retaining-compounds', '', '', 'Adhesives, Sealants & Lubricants', 1610, true
FROM public.catalog_main_categories
WHERE name = 'Tapes, Adhesives & Lubricants';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'General Purpose Adhesives', 'general-purpose-adhesives', '', '', 'Adhesives, Sealants & Lubricants', 1620, true
FROM public.catalog_main_categories
WHERE name = 'Tapes, Adhesives & Lubricants';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Epoxy Putty & Repair Compounds', 'epoxy-putty-and-repair-compounds', '', '', 'Adhesives, Sealants & Lubricants', 1630, true
FROM public.catalog_main_categories
WHERE name = 'Tapes, Adhesives & Lubricants';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Lubricant Sprays & Rust Removers', 'lubricant-sprays-and-rust-removers', '', '', 'Adhesives, Sealants & Lubricants', 1640, true
FROM public.catalog_main_categories
WHERE name = 'Tapes, Adhesives & Lubricants';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Silicone Sealants', 'silicone-sealants', '', '', 'Adhesives, Sealants & Lubricants', 1650, true
FROM public.catalog_main_categories
WHERE name = 'Tapes, Adhesives & Lubricants';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Anaerobic Adhesives', 'anaerobic-adhesives', '', '', 'Adhesives, Sealants & Lubricants', 1660, true
FROM public.catalog_main_categories
WHERE name = 'Tapes, Adhesives & Lubricants';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Instant Adhesives (Cyanoacrylate)', 'instant-adhesives-cyanoacrylate', '', '', 'Adhesives, Sealants & Lubricants', 1670, true
FROM public.catalog_main_categories
WHERE name = 'Tapes, Adhesives & Lubricants';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'RTV & Gasket Sealants', 'rtv-and-gasket-sealants', '', '', 'Adhesives, Sealants & Lubricants', 1680, true
FROM public.catalog_main_categories
WHERE name = 'Tapes, Adhesives & Lubricants';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Repair & Leak Tapes', 'repair-and-leak-tapes', '', '', 'Adhesives, Sealants & Lubricants', 1690, true
FROM public.catalog_main_categories
WHERE name = 'Tapes, Adhesives & Lubricants';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Caution & Barrier Tapes', 'caution-and-barrier-tapes', '', '', 'Adhesives, Sealants & Lubricants', 1700, true
FROM public.catalog_main_categories
WHERE name = 'Tapes, Adhesives & Lubricants';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Expanding Foam & Fillers', 'expanding-foam-and-fillers', '', '', 'Adhesives, Sealants & Lubricants', 1710, true
FROM public.catalog_main_categories
WHERE name = 'Tapes, Adhesives & Lubricants';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Industrial Oils & Gear Oils', 'industrial-oils-and-gear-oils', '', '', 'Adhesives, Sealants & Lubricants', 1720, true
FROM public.catalog_main_categories
WHERE name = 'Tapes, Adhesives & Lubricants';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Angle Grinders', 'angle-grinders', '', '', 'Power Tools', 1730, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Welding Rods & Electrodes', 'welding-rods-and-electrodes', '', '', 'Welding & Gas Cutting', 1740, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Drill Machines', 'drill-machines', '', '', 'Power Tools', 1750, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'MIG Wire & Accessories', 'mig-wire-and-accessories', '', '', 'Welding & Gas Cutting', 1760, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Welding Machines', 'welding-machines', '', '', 'Power Tools', 1770, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Gas Cutting Torches', 'gas-cutting-torches', '', '', 'Welding & Gas Cutting', 1780, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Air Blowers & Dust Blowers', 'air-blowers-and-dust-blowers', '', '', 'Power Tools', 1790, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Cut Off Machines & Chopsaws', 'cut-off-machines-and-chopsaws', '', '', 'Power Tools', 1800, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Gas Cutting Nozzles', 'gas-cutting-nozzles', '', '', 'Welding & Gas Cutting', 1810, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Gas Regulators', 'gas-regulators', '', '', 'Welding & Gas Cutting', 1820, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Gas Welding Accessories', 'gas-welding-accessories', '', '', 'Welding & Gas Cutting', 1830, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Welding Accessories', 'welding-accessories', '', '', 'Welding & Gas Cutting', 1840, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Cordless Power Tools', 'cordless-power-tools', '', '', 'Power Tools', 1850, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Demolition & Rotary Hammers', 'demolition-and-rotary-hammers', '', '', 'Power Tools', 1860, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Spray Guns & Paint Tools', 'spray-guns-and-paint-tools', '', '', 'Power Tools', 1870, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Die Grinders & Rotary Tools', 'die-grinders-and-rotary-tools', '', '', 'Power Tools', 1880, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Marble & Tile Cutters', 'marble-and-tile-cutters', '', '', 'Power Tools', 1890, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Heat Guns & Hot Air Tools', 'heat-guns-and-hot-air-tools', '', '', 'Power Tools', 1900, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Sanders & Planers', 'sanders-and-planers', '', '', 'Power Tools', 1910, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Specialty Power Tools', 'specialty-power-tools', '', '', 'Power Tools', 1920, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Vacuum Cleaners', 'vacuum-cleaners', '', '', 'Power Tools', 1930, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Bench Grinders', 'bench-grinders', '', '', 'Power Tools', 1940, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Jigsaw & Reciprocating Saws', 'jigsaw-and-reciprocating-saws', '', '', 'Power Tools', 1950, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Mixers & Stirrers', 'mixers-and-stirrers', '', '', 'Power Tools', 1960, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'Pressure Washers', 'pressure-washers', '', '', 'Power Tools', 1970, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, description, legacy_category_name, display_order, is_active)
SELECT id, 'TIG Welding Equipment', 'tig-welding-equipment', '', '', 'Welding & Gas Cutting', 1980, true
FROM public.catalog_main_categories
WHERE name = 'Tools & Test Instruments';

