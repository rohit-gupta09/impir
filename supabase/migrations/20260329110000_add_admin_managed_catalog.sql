ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS main_category_id uuid,
ADD COLUMN IF NOT EXISTS subcategory_id uuid;

CREATE TABLE IF NOT EXISTS public.catalog_main_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  image_url text DEFAULT '',
  description text DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name),
  UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS public.catalog_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  main_category_id uuid NOT NULL REFERENCES public.catalog_main_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  image_url text DEFAULT '',
  description text DEFAULT '',
  legacy_category_name text DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (main_category_id, name),
  UNIQUE (main_category_id, slug)
);

ALTER TABLE public.products
ADD CONSTRAINT products_main_category_id_fkey
FOREIGN KEY (main_category_id) REFERENCES public.catalog_main_categories(id) ON DELETE SET NULL;

ALTER TABLE public.products
ADD CONSTRAINT products_subcategory_id_fkey
FOREIGN KEY (subcategory_id) REFERENCES public.catalog_subcategories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS catalog_main_categories_display_order_idx
ON public.catalog_main_categories (display_order, name);

CREATE INDEX IF NOT EXISTS catalog_subcategories_main_category_id_idx
ON public.catalog_subcategories (main_category_id, display_order, name);

CREATE INDEX IF NOT EXISTS products_main_category_id_idx
ON public.products (main_category_id);

CREATE INDEX IF NOT EXISTS products_subcategory_id_idx
ON public.products (subcategory_id);

ALTER TABLE public.catalog_main_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catalog main categories are viewable by everyone"
ON public.catalog_main_categories FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage catalog main categories"
ON public.catalog_main_categories FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Catalog subcategories are viewable by everyone"
ON public.catalog_subcategories FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage catalog subcategories"
ON public.catalog_subcategories FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_catalog_main_categories_updated_at ON public.catalog_main_categories;
CREATE TRIGGER update_catalog_main_categories_updated_at
BEFORE UPDATE ON public.catalog_main_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_catalog_subcategories_updated_at ON public.catalog_subcategories;
CREATE TRIGGER update_catalog_subcategories_updated_at
BEFORE UPDATE ON public.catalog_subcategories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.catalog_main_categories (name, slug, image_url, display_order)
VALUES
  ('Fasteners & Hardware', 'fasteners-and-hardware', 'https://commons.wikimedia.org/wiki/Special:FilePath/Bolt_and_nut.jpg?width=500', 10),
  ('Tools & Test Instruments', 'tools-and-test-instruments', 'https://commons.wikimedia.org/wiki/Special:FilePath/Bosch_angle_grinder.jpg?width=500', 20),
  ('Hand Tools', 'hand-tools', 'https://commons.wikimedia.org/wiki/Special:FilePath/Hand_tools.jpg?width=500', 30),
  ('Metalworking & Fabrication', 'metalworking-and-fabrication', 'https://commons.wikimedia.org/wiki/Special:FilePath/Twist_drill_bits.jpg?width=500', 40),
  ('Motors & Power Transmission', 'motors-and-power-transmission', 'https://commons.wikimedia.org/wiki/Special:FilePath/Electric_motor.jpg?width=500', 50),
  ('Pneumatics & Hydraulics', 'pneumatics-and-hydraulics', 'https://commons.wikimedia.org/wiki/Special:FilePath/Air_compressor.jpg?width=500', 60),
  ('Safety & Security', 'safety-and-security', 'https://commons.wikimedia.org/wiki/Special:FilePath/Safety_helmet.jpg?width=500', 70),
  ('Lighting & Electrical', 'lighting-and-electrical', 'https://commons.wikimedia.org/wiki/Special:FilePath/Compact_fluorescent_lamp.jpg?width=500', 80),
  ('Pipes, Hose & Fittings', 'pipes-hose-and-fittings', 'https://commons.wikimedia.org/wiki/Special:FilePath/Copper_pipe.jpg?width=500', 90),
  ('Tapes, Adhesives & Lubricants', 'tapes-adhesives-and-lubricants', 'https://commons.wikimedia.org/wiki/Special:FilePath/Silicone_sealant.jpg?width=500', 100),
  ('Material Handling & Lifting', 'material-handling-and-lifting', 'https://commons.wikimedia.org/wiki/Special:FilePath/Chain_hoist.jpg?width=500', 110),
  ('Sockets & Drive Tools', 'sockets-and-drive-tools', 'https://commons.wikimedia.org/wiki/Special:FilePath/Socket_wrench_set.jpg?width=500', 120),
  ('Measuring & Precision Tools', 'measuring-and-precision-tools', 'https://commons.wikimedia.org/wiki/Special:FilePath/Vernier_caliper.jpg?width=500', 130),
  ('Building & Grounds', 'building-and-grounds', 'https://commons.wikimedia.org/wiki/Special:FilePath/Steel_rebar.jpg?width=500', 140)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  image_url = EXCLUDED.image_url,
  display_order = EXCLUDED.display_order,
  is_active = true,
  updated_at = now();

WITH subcategory_seed(main_slug, name, slug, image_url, legacy_category_name, display_order) AS (
  VALUES
    ('fasteners-and-hardware', 'Allen Bolts (Socket Cap Screws)', 'allen-bolts', 'https://commons.wikimedia.org/wiki/Special:FilePath/Hex_socket_head_cap_screw.jpg?width=400', 'Fasteners & Hardware', 10),
    ('fasteners-and-hardware', 'Hex Bolts & Screws', 'hex-bolts-and-screws', 'https://commons.wikimedia.org/wiki/Special:FilePath/Bolt_and_nut.jpg?width=400', 'Fasteners & Hardware', 20),
    ('fasteners-and-hardware', 'Nuts (Hex, Nylock, Flange, Dome)', 'nuts', 'https://commons.wikimedia.org/wiki/Special:FilePath/Hex_nuts.jpg?width=400', 'Fasteners & Hardware', 30),
    ('fasteners-and-hardware', 'Washers (Flat, Spring, Lock)', 'washers', 'https://commons.wikimedia.org/wiki/Special:FilePath/Washers.jpg?width=400', 'Fasteners & Hardware', 40),
    ('fasteners-and-hardware', 'Studs & Threaded Rods', 'studs-and-threaded-rods', 'https://commons.wikimedia.org/wiki/Special:FilePath/Threaded_rod.jpg?width=400', 'Fasteners & Hardware', 50),
    ('fasteners-and-hardware', 'CSK & Countersunk Bolts', 'csk-and-countersunk-bolts', 'https://commons.wikimedia.org/wiki/Special:FilePath/Countersunk_screws.jpg?width=400', 'Fasteners & Hardware', 60),
    ('fasteners-and-hardware', 'Self Drilling Screws', 'self-drilling-screws', 'https://commons.wikimedia.org/wiki/Special:FilePath/Self-tapping_screws.jpg?width=400', 'Fasteners & Hardware', 70),
    ('fasteners-and-hardware', 'Grub Screws (Set Screws)', 'grub-screws', 'https://commons.wikimedia.org/wiki/Special:FilePath/Set_screw.jpg?width=400', 'Fasteners & Hardware', 80),
    ('fasteners-and-hardware', 'Foundation & Anchor Bolts', 'foundation-and-anchor-bolts', 'https://commons.wikimedia.org/wiki/Special:FilePath/Anchor_bolts.jpg?width=400', 'Fasteners & Hardware', 90),
    ('fasteners-and-hardware', 'Rivets & Pop Rivets', 'rivets', 'https://commons.wikimedia.org/wiki/Special:FilePath/Blind_rivets.jpg?width=400', 'Fasteners & Hardware', 100),

    ('tools-and-test-instruments', 'Angle Grinders', 'angle-grinders', 'https://commons.wikimedia.org/wiki/Special:FilePath/Bosch_angle_grinder.jpg?width=400', 'Power Tools', 10),
    ('tools-and-test-instruments', 'Drill Machines', 'drill-machines', 'https://commons.wikimedia.org/wiki/Special:FilePath/Power_drill.jpg?width=400', 'Power Tools', 20),
    ('tools-and-test-instruments', 'Demolition & Rotary Hammers', 'demolition-and-rotary-hammers', 'https://commons.wikimedia.org/wiki/Special:FilePath/Rotary_hammer.jpg?width=400', 'Power Tools', 30),
    ('tools-and-test-instruments', 'Cut Off Machines & Chopsaws', 'cut-off-machines-and-chopsaws', 'https://commons.wikimedia.org/wiki/Special:FilePath/Abrasive_saw.jpg?width=400', 'Power Tools', 40),
    ('tools-and-test-instruments', 'Welding Machines', 'welding-machines', 'https://commons.wikimedia.org/wiki/Special:FilePath/Arc_welding.jpg?width=400', 'Power Tools', 50),
    ('tools-and-test-instruments', 'Die Grinders & Sanders', 'die-grinders-and-sanders', 'https://commons.wikimedia.org/wiki/Special:FilePath/Random_orbit_sander.jpg?width=400', 'Power Tools', 60),
    ('tools-and-test-instruments', 'Heat Guns & Blowers', 'heat-guns-and-blowers', 'https://commons.wikimedia.org/wiki/Special:FilePath/Heat_gun.jpg?width=400', 'Power Tools', 70),
    ('tools-and-test-instruments', 'Jigsaw & Marble Cutters', 'jigsaw-and-marble-cutters', 'https://commons.wikimedia.org/wiki/Special:FilePath/Jigsaw.jpg?width=400', 'Power Tools', 80),
    ('tools-and-test-instruments', 'Bench Grinders', 'bench-grinders', 'https://commons.wikimedia.org/wiki/Special:FilePath/Bench_grinder.jpg?width=400', 'Power Tools', 90),
    ('tools-and-test-instruments', 'Cordless Power Tools', 'cordless-power-tools', 'https://commons.wikimedia.org/wiki/Special:FilePath/Cordless_drill.jpg?width=400', 'Power Tools', 100),

    ('hand-tools', 'Spanners & Wrenches', 'spanners-and-wrenches', 'https://commons.wikimedia.org/wiki/Special:FilePath/Combination_wrenches.jpg?width=400', 'Hand Tools', 10),
    ('hand-tools', 'Pliers & Cutters', 'pliers-and-cutters', 'https://commons.wikimedia.org/wiki/Special:FilePath/Pliers.jpg?width=400', 'Hand Tools', 20),
    ('hand-tools', 'Hammers & Mallets', 'hammers-and-mallets', 'https://commons.wikimedia.org/wiki/Special:FilePath/Claw-hammer.jpg?width=400', 'Hand Tools', 30),
    ('hand-tools', 'Chisels & Punches', 'chisels-and-punches', 'https://commons.wikimedia.org/wiki/Special:FilePath/Cold_chisel.jpg?width=400', 'Hand Tools', 40),
    ('hand-tools', 'Files & Rasps', 'files-and-rasps', 'https://commons.wikimedia.org/wiki/Special:FilePath/File_tool.jpg?width=400', 'Hand Tools', 50),
    ('hand-tools', 'Screwdrivers', 'screwdrivers', 'https://commons.wikimedia.org/wiki/Special:FilePath/Screwdrivers.jpg?width=400', 'Hand Tools', 60),
    ('hand-tools', 'Bench Vices & Clamps', 'bench-vices-and-clamps', 'https://commons.wikimedia.org/wiki/Special:FilePath/Bench_vice.jpg?width=400', 'Hand Tools', 70),
    ('hand-tools', 'Bolt & Cable Cutters', 'bolt-and-cable-cutters', 'https://commons.wikimedia.org/wiki/Special:FilePath/Bolt_cutter.jpg?width=400', 'Hand Tools', 80),
    ('hand-tools', 'Measuring & Layout Tools', 'measuring-and-layout-tools', 'https://commons.wikimedia.org/wiki/Special:FilePath/Tape_measure.jpg?width=400', 'Measurement & Layout Tools', 90),
    ('hand-tools', 'Allen Keys & Hex Keys', 'allen-keys-and-hex-keys', 'https://commons.wikimedia.org/wiki/Special:FilePath/Hex_keys.jpg?width=400', 'Hand Tools', 100),

    ('metalworking-and-fabrication', 'Drill Bits (PS, TS, SDS)', 'drill-bits', 'https://commons.wikimedia.org/wiki/Special:FilePath/Twist_drill_bits.jpg?width=400', 'Power Tools', 10),
    ('metalworking-and-fabrication', 'Annular Cutters & Core Bits', 'annular-cutters-and-core-bits', 'https://commons.wikimedia.org/wiki/Special:FilePath/Annular_cutter.jpg?width=400', 'Power Tools', 20),
    ('metalworking-and-fabrication', 'Taps & Dies (Threading Tools)', 'taps-and-dies', 'https://commons.wikimedia.org/wiki/Special:FilePath/Tap_and_die_set.jpg?width=400', 'Hand Tools', 30),
    ('metalworking-and-fabrication', 'End Mills & Milling Cutters', 'end-mills-and-milling-cutters', 'https://commons.wikimedia.org/wiki/Special:FilePath/Endmill.jpg?width=400', 'Power Tools', 40),
    ('metalworking-and-fabrication', 'Hole Saws', 'hole-saws', 'https://commons.wikimedia.org/wiki/Special:FilePath/Hole_saw.jpg?width=400', 'Power Tools', 50),
    ('metalworking-and-fabrication', 'Cutting Wheels & Discs', 'cutting-wheels-and-discs', 'https://commons.wikimedia.org/wiki/Special:FilePath/Cutting_disc.jpg?width=400', 'Power Tools', 60),
    ('metalworking-and-fabrication', 'Grinding Wheels', 'grinding-wheels', 'https://commons.wikimedia.org/wiki/Special:FilePath/Grinding_wheel.jpg?width=400', 'Power Tools', 70),
    ('metalworking-and-fabrication', 'Flap Discs & Abrasives', 'flap-discs-and-abrasives', 'https://commons.wikimedia.org/wiki/Special:FilePath/Flap_disc.jpg?width=400', 'Power Tools', 80),
    ('metalworking-and-fabrication', 'Welding Rods & Electrodes', 'welding-rods-and-electrodes', 'https://commons.wikimedia.org/wiki/Special:FilePath/Welding_electrode.jpg?width=400', 'Power Tools', 90),
    ('metalworking-and-fabrication', 'MIG & TIG Accessories', 'mig-and-tig-accessories', 'https://commons.wikimedia.org/wiki/Special:FilePath/TIG_welding_torch.jpg?width=400', 'Power Tools', 100),

    ('motors-and-power-transmission', 'V-Belts & Poly Belts', 'v-belts-and-poly-belts', 'https://commons.wikimedia.org/wiki/Special:FilePath/V-belt.jpg?width=400', 'Electrical Supplies', 10),
    ('motors-and-power-transmission', 'Bearings', 'bearings', 'https://commons.wikimedia.org/wiki/Special:FilePath/Ball_bearing.jpg?width=400', 'Electrical Supplies', 20),
    ('motors-and-power-transmission', 'Chains & Sprockets', 'chains-and-sprockets', 'https://commons.wikimedia.org/wiki/Special:FilePath/Roller_chain.jpg?width=400', 'Electrical Supplies', 30),
    ('motors-and-power-transmission', 'Pulleys & Couplings', 'pulleys-and-couplings', 'https://commons.wikimedia.org/wiki/Special:FilePath/Belt_and_pulley.jpg?width=400', 'Electrical Supplies', 40),
    ('motors-and-power-transmission', 'Seals & O-Rings', 'seals-and-o-rings', 'https://commons.wikimedia.org/wiki/Special:FilePath/O-rings.jpg?width=400', 'Electrical Supplies', 50),
    ('motors-and-power-transmission', 'Power Tool Spares (Armatures, Carbon Brushes)', 'power-tool-spares', 'https://commons.wikimedia.org/wiki/Special:FilePath/Carbon_brushes.jpg?width=400', 'Electrical Supplies', 60),
    ('motors-and-power-transmission', 'Gear Oils & Lubricants', 'gear-oils-and-lubricants', 'https://commons.wikimedia.org/wiki/Special:FilePath/Lubricating_oil.jpg?width=400', 'Electrical Supplies', 70),

    ('pneumatics-and-hydraulics', 'Air Compressors', 'air-compressors', 'https://commons.wikimedia.org/wiki/Special:FilePath/Air_compressor.jpg?width=400', 'Plumbing', 10),
    ('pneumatics-and-hydraulics', 'Air Impact Wrenches', 'air-impact-wrenches', 'https://commons.wikimedia.org/wiki/Special:FilePath/Impact_wrench.jpg?width=400', 'Power Tools', 20),
    ('pneumatics-and-hydraulics', 'Pneumatic Fittings & Connectors', 'pneumatic-fittings-and-connectors', 'https://commons.wikimedia.org/wiki/Special:FilePath/Pneumatic_fittings.jpg?width=400', 'Plumbing', 30),
    ('pneumatics-and-hydraulics', 'PU Pipes & Air Hoses', 'pu-pipes-and-air-hoses', 'https://commons.wikimedia.org/wiki/Special:FilePath/Air_hose.jpg?width=400', 'Plumbing', 40),
    ('pneumatics-and-hydraulics', 'Hydraulic Jacks', 'hydraulic-jacks', 'https://commons.wikimedia.org/wiki/Special:FilePath/Hydraulic_jack.jpg?width=400', 'Plumbing', 50),
    ('pneumatics-and-hydraulics', 'Pressure & Vacuum Gauges', 'pressure-and-vacuum-gauges', 'https://commons.wikimedia.org/wiki/Special:FilePath/Pressure_gauge.jpg?width=400', 'Measurement & Layout Tools', 60),
    ('pneumatics-and-hydraulics', 'FRL Units & Regulators', 'frl-units-and-regulators', 'https://commons.wikimedia.org/wiki/Special:FilePath/Pressure_regulator.jpg?width=400', 'Plumbing', 70),
    ('pneumatics-and-hydraulics', 'Air Guns & Blow Guns', 'air-guns-and-blow-guns', 'https://commons.wikimedia.org/wiki/Special:FilePath/Air_blow_gun.jpg?width=400', 'Power Tools', 80),

    ('safety-and-security', 'Safety Helmets', 'safety-helmets', 'https://commons.wikimedia.org/wiki/Special:FilePath/Safety_helmet.jpg?width=400', 'Safety Equipment', 10),
    ('safety-and-security', 'Safety Harness & Belts', 'safety-harness-and-belts', 'https://commons.wikimedia.org/wiki/Special:FilePath/Safety_harness.jpg?width=400', 'Safety Equipment', 20),
    ('safety-and-security', 'Safety Shoes & Boots', 'safety-shoes-and-boots', 'https://commons.wikimedia.org/wiki/Special:FilePath/Safety_boots.jpg?width=400', 'Safety Equipment', 30),
    ('safety-and-security', 'Gloves (Work, Chemical, Welding)', 'gloves', 'https://commons.wikimedia.org/wiki/Special:FilePath/Work_gloves.jpg?width=400', 'Safety Equipment', 40),
    ('safety-and-security', 'Eye & Face Protection', 'eye-and-face-protection', 'https://commons.wikimedia.org/wiki/Special:FilePath/Safety_glasses.jpg?width=400', 'Safety Equipment', 50),
    ('safety-and-security', 'Ear Protection', 'ear-protection', 'https://commons.wikimedia.org/wiki/Special:FilePath/Hearing_protection.jpg?width=400', 'Safety Equipment', 60),
    ('safety-and-security', 'Fire Safety Equipment', 'fire-safety-equipment', 'https://commons.wikimedia.org/wiki/Special:FilePath/Fire_extinguisher.jpg?width=400', 'Safety Equipment', 70),
    ('safety-and-security', 'Safety Clothing & PPE', 'safety-clothing-and-ppe', 'https://commons.wikimedia.org/wiki/Special:FilePath/High-visibility_clothing.jpg?width=400', 'Safety Equipment', 80),

    ('lighting-and-electrical', 'Screwdrivers (Insulated)', 'insulated-screwdrivers', 'https://commons.wikimedia.org/wiki/Special:FilePath/Electrical_screwdrivers.jpg?width=400', 'Electrical Supplies', 10),
    ('lighting-and-electrical', 'Multimeters & Clamp Meters', 'multimeters-and-clamp-meters', 'https://commons.wikimedia.org/wiki/Special:FilePath/Digital_multimeter.jpg?width=400', 'Measurement & Layout Tools', 20),
    ('lighting-and-electrical', 'Line & Voltage Testers', 'line-and-voltage-testers', 'https://commons.wikimedia.org/wiki/Special:FilePath/Voltage_tester.jpg?width=400', 'Electrical Supplies', 30),
    ('lighting-and-electrical', 'Crimping & Wire Tools', 'crimping-and-wire-tools', 'https://commons.wikimedia.org/wiki/Special:FilePath/Crimping_tool.jpg?width=400', 'Electrical Supplies', 40),
    ('lighting-and-electrical', 'Electrical Tapes & Cables', 'electrical-tapes-and-cables', 'https://commons.wikimedia.org/wiki/Special:FilePath/Electrical_wires.jpg?width=400', 'Electrical Supplies', 50),
    ('lighting-and-electrical', 'Soldering Equipment', 'soldering-equipment', 'https://commons.wikimedia.org/wiki/Special:FilePath/Soldering_iron.jpg?width=400', 'Electrical Supplies', 60),
    ('lighting-and-electrical', 'Cable Management', 'cable-management', 'https://commons.wikimedia.org/wiki/Special:FilePath/Cable_ties.jpg?width=400', 'Electrical Supplies', 70),

    ('pipes-hose-and-fittings', 'Ball Valves & Gate Valves', 'ball-and-gate-valves', 'https://commons.wikimedia.org/wiki/Special:FilePath/Ball_valve.jpg?width=400', 'Plumbing', 10),
    ('pipes-hose-and-fittings', 'Hose Pipes (Industrial)', 'hose-pipes', 'https://commons.wikimedia.org/wiki/Special:FilePath/Garden_hose.jpg?width=400', 'Plumbing', 20),
    ('pipes-hose-and-fittings', 'PVC & Braided Pipes', 'pvc-and-braided-pipes', 'https://commons.wikimedia.org/wiki/Special:FilePath/PVC_pipe.jpg?width=400', 'Plumbing', 30),
    ('pipes-hose-and-fittings', 'Pipe Fittings & Adapters', 'pipe-fittings-and-adapters', 'https://commons.wikimedia.org/wiki/Special:FilePath/Pipe_fittings.jpg?width=400', 'Plumbing', 40),
    ('pipes-hose-and-fittings', 'Hose Clamps & Clips', 'hose-clamps-and-clips', 'https://commons.wikimedia.org/wiki/Special:FilePath/Hose_clamp.jpg?width=400', 'Plumbing', 50),
    ('pipes-hose-and-fittings', 'Nipples & Couplings', 'nipples-and-couplings', 'https://commons.wikimedia.org/wiki/Special:FilePath/Pipe_coupling.jpg?width=400', 'Plumbing', 60),
    ('pipes-hose-and-fittings', 'Washing & Spray Equipment', 'washing-and-spray-equipment', 'https://commons.wikimedia.org/wiki/Special:FilePath/Spray_gun.jpg?width=400', 'Plumbing', 70),

    ('tapes-adhesives-and-lubricants', 'Epoxy Adhesives (Araldite)', 'epoxy-adhesives', 'https://commons.wikimedia.org/wiki/Special:FilePath/Epoxy_resin.jpg?width=400', 'Adhesives & Sealants', 10),
    ('tapes-adhesives-and-lubricants', 'Threadlockers (Loctite)', 'threadlockers', 'https://commons.wikimedia.org/wiki/Special:FilePath/Threadlocker.jpg?width=400', 'Adhesives & Sealants', 20),
    ('tapes-adhesives-and-lubricants', 'Silicone Sealants', 'silicone-sealants', 'https://commons.wikimedia.org/wiki/Special:FilePath/Silicone_sealant.jpg?width=400', 'Adhesives & Sealants', 30),
    ('tapes-adhesives-and-lubricants', 'Pipe Sealants (M-Seal)', 'pipe-sealants', 'https://commons.wikimedia.org/wiki/Special:FilePath/Epoxy_putty.jpg?width=400', 'Adhesives & Sealants', 40),
    ('tapes-adhesives-and-lubricants', 'Lubricant Sprays (WD-40, CRC)', 'lubricant-sprays', 'https://commons.wikimedia.org/wiki/Special:FilePath/Lubricating_oil.jpg?width=400', 'Adhesives & Sealants', 50),
    ('tapes-adhesives-and-lubricants', 'Industrial Grease', 'industrial-grease', 'https://commons.wikimedia.org/wiki/Special:FilePath/Grease.jpg?width=400', 'Adhesives & Sealants', 60),
    ('tapes-adhesives-and-lubricants', 'PVC & Electrical Tapes', 'pvc-and-electrical-tapes', 'https://commons.wikimedia.org/wiki/Special:FilePath/Electrical_tape.jpg?width=400', 'Electrical Supplies', 70),
    ('tapes-adhesives-and-lubricants', 'Repair Tapes & Compounds', 'repair-tapes-and-compounds', 'https://commons.wikimedia.org/wiki/Special:FilePath/Duct_tape.jpg?width=400', 'Adhesives & Sealants', 80),

    ('material-handling-and-lifting', 'Chain Blocks & Hoists', 'chain-blocks-and-hoists', 'https://commons.wikimedia.org/wiki/Special:FilePath/Chain_hoist.jpg?width=400', 'Building Materials', 10),
    ('material-handling-and-lifting', 'Lifting Slings & Belts', 'lifting-slings-and-belts', 'https://commons.wikimedia.org/wiki/Special:FilePath/Lifting_slings.jpg?width=400', 'Building Materials', 20),
    ('material-handling-and-lifting', 'Eye Hooks & Shackles', 'eye-hooks-and-shackles', 'https://commons.wikimedia.org/wiki/Special:FilePath/Shackle.jpg?width=400', 'Building Materials', 30),
    ('material-handling-and-lifting', 'Industrial Chains', 'industrial-chains', 'https://commons.wikimedia.org/wiki/Special:FilePath/Roller_chain.jpg?width=400', 'Building Materials', 40),
    ('material-handling-and-lifting', 'Hydraulic Jacks & Trolleys', 'hydraulic-jacks-and-trolleys', 'https://commons.wikimedia.org/wiki/Special:FilePath/Floor_jack.jpg?width=400', 'Building Materials', 50),
    ('material-handling-and-lifting', 'Ropes & Wire Ropes', 'ropes-and-wire-ropes', 'https://commons.wikimedia.org/wiki/Special:FilePath/Wire_rope.jpg?width=400', 'Building Materials', 60),
    ('material-handling-and-lifting', 'Rigging Accessories', 'rigging-accessories', 'https://commons.wikimedia.org/wiki/Special:FilePath/Lifting_hook.jpg?width=400', 'Building Materials', 70),

    ('sockets-and-drive-tools', 'Impact Sockets (1/2", 3/4", 1")', 'impact-sockets', 'https://commons.wikimedia.org/wiki/Special:FilePath/Socket_set.jpg?width=400', 'Hand Tools', 10),
    ('sockets-and-drive-tools', 'Allen & Hex Sockets', 'allen-and-hex-sockets', 'https://commons.wikimedia.org/wiki/Special:FilePath/Hex_sockets.jpg?width=400', 'Hand Tools', 20),
    ('sockets-and-drive-tools', 'Torx / Star Sockets', 'torx-and-star-sockets', 'https://commons.wikimedia.org/wiki/Special:FilePath/Torx_bits.jpg?width=400', 'Hand Tools', 30),
    ('sockets-and-drive-tools', 'Socket Sets', 'socket-sets', 'https://commons.wikimedia.org/wiki/Special:FilePath/Socket_wrench_set.jpg?width=400', 'Hand Tools', 40),
    ('sockets-and-drive-tools', 'Ratchet Handles & Extensions', 'ratchet-handles-and-extensions', 'https://commons.wikimedia.org/wiki/Special:FilePath/Ratchet_socket_wrench.jpg?width=400', 'Hand Tools', 50),
    ('sockets-and-drive-tools', 'Torque Wrenches', 'torque-wrenches', 'https://commons.wikimedia.org/wiki/Special:FilePath/Torque_wrench.jpg?width=400', 'Measurement & Layout Tools', 60),

    ('measuring-and-precision-tools', 'Vernier & Digital Calipers', 'vernier-and-digital-calipers', 'https://commons.wikimedia.org/wiki/Special:FilePath/Vernier_caliper.jpg?width=400', 'Measurement & Layout Tools', 10),
    ('measuring-and-precision-tools', 'Micrometers', 'micrometers', 'https://commons.wikimedia.org/wiki/Special:FilePath/Micrometer.jpg?width=400', 'Measurement & Layout Tools', 20),
    ('measuring-and-precision-tools', 'Dial Indicators', 'dial-indicators', 'https://commons.wikimedia.org/wiki/Special:FilePath/Dial_indicator.jpg?width=400', 'Measurement & Layout Tools', 30),
    ('measuring-and-precision-tools', 'Spirit Levels', 'spirit-levels', 'https://commons.wikimedia.org/wiki/Special:FilePath/Spirit_level.jpg?width=400', 'Measurement & Layout Tools', 40),
    ('measuring-and-precision-tools', 'Measuring Tapes', 'measuring-tapes', 'https://commons.wikimedia.org/wiki/Special:FilePath/Tape_measure.jpg?width=400', 'Measurement & Layout Tools', 50),
    ('measuring-and-precision-tools', 'Laser Distance Meters', 'laser-distance-meters', 'https://commons.wikimedia.org/wiki/Special:FilePath/Laser_distance_meter.jpg?width=400', 'Measurement & Layout Tools', 60),
    ('measuring-and-precision-tools', 'Try Squares & Gauges', 'try-squares-and-gauges', 'https://commons.wikimedia.org/wiki/Special:FilePath/Try_square.jpg?width=400', 'Measurement & Layout Tools', 70),
    ('measuring-and-precision-tools', 'Height & Depth Gauges', 'height-and-depth-gauges', 'https://commons.wikimedia.org/wiki/Special:FilePath/Height_gauge.jpg?width=400', 'Measurement & Layout Tools', 80),

    ('building-and-grounds', 'MS Rods & Steel', 'ms-rods-and-steel', 'https://commons.wikimedia.org/wiki/Special:FilePath/Steel_rebar.jpg?width=400', 'Building Materials', 10),
    ('building-and-grounds', 'Anchor Rods & Chemical Anchors', 'anchor-rods-and-chemical-anchors', 'https://commons.wikimedia.org/wiki/Special:FilePath/Anchor_bolts.jpg?width=400', 'Building Materials', 20),
    ('building-and-grounds', 'Construction Fasteners', 'construction-fasteners', 'https://commons.wikimedia.org/wiki/Special:FilePath/Self-tapping_screws.jpg?width=400', 'Fasteners & Hardware', 30),
    ('building-and-grounds', 'Sheet Metal & Plates', 'sheet-metal-and-plates', 'https://commons.wikimedia.org/wiki/Special:FilePath/Sheet_metal.jpg?width=400', 'Building Materials', 40),
    ('building-and-grounds', 'General Building Hardware', 'general-building-hardware', 'https://commons.wikimedia.org/wiki/Special:FilePath/Construction_hardware.jpg?width=400', 'Building Materials', 50)
)
INSERT INTO public.catalog_subcategories (main_category_id, name, slug, image_url, legacy_category_name, display_order)
SELECT mc.id, seed.name, seed.slug, seed.image_url, seed.legacy_category_name, seed.display_order
FROM subcategory_seed seed
JOIN public.catalog_main_categories mc ON mc.slug = seed.main_slug
ON CONFLICT (main_category_id, slug) DO UPDATE
SET
  name = EXCLUDED.name,
  image_url = EXCLUDED.image_url,
  legacy_category_name = EXCLUDED.legacy_category_name,
  display_order = EXCLUDED.display_order,
  is_active = true,
  updated_at = now();

UPDATE public.products p
SET main_category_id = mc.id
FROM public.catalog_main_categories mc
WHERE p.main_category_id IS NULL
  AND (
    (p.category = 'Fasteners & Hardware' AND mc.slug = 'fasteners-and-hardware') OR
    (p.category = 'Power Tools' AND mc.slug = 'tools-and-test-instruments') OR
    (p.category = 'Hand Tools' AND mc.slug = 'hand-tools') OR
    (p.category = 'Measurement & Layout Tools' AND mc.slug = 'measuring-and-precision-tools') OR
    (p.category = 'Safety Equipment' AND mc.slug = 'safety-and-security') OR
    (p.category = 'Electrical Supplies' AND mc.slug = 'lighting-and-electrical') OR
    (p.category = 'Plumbing' AND mc.slug = 'pipes-hose-and-fittings') OR
    (p.category = 'Adhesives & Sealants' AND mc.slug = 'tapes-adhesives-and-lubricants') OR
    (p.category = 'Building Materials' AND mc.slug = 'building-and-grounds')
  );

UPDATE public.products p
SET subcategory_id = cs.id
FROM public.catalog_subcategories cs
WHERE p.subcategory_id IS NULL
  AND p.category = cs.legacy_category_name
  AND p.main_category_id = cs.main_category_id;
