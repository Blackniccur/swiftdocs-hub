-- Add new service types to the enum
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'mindtrift';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'lilt_ai';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'handshake_oscar';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'project_hedgehog';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'outlier_philippines';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'outlier_uk';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'handshake_helix';