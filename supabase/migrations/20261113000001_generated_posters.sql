begin;

-- Replace only unchanged placeholder poster paths. Preserve custom media and publication state.
update public.templates
set poster_url = '/demo/' || slug || '.jpg'
where slug in (
  'runway-walk', 'floating-product', 'sunset-portrait', 'cinematic-car',
  'neon-walk', 'luxury-bottle', 'dream-room', 'outfit-switch',
  'orbit-object', 'animal-adventure', 'sports-moment'
)
and poster_url = '/demo/' || slug || '.svg';

commit;
