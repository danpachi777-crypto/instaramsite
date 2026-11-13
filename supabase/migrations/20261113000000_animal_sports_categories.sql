begin;

alter table public.templates
  drop constraint templates_category_check;
alter table public.templates
  add constraint templates_category_check
  check (category in ('fashion', 'product', 'lifestyle', 'cinematic', 'effects', 'animals', 'sports'));

insert into public.templates
  (slug, title, description, category, poster_url, aspect_ratio, is_published, sort_order)
values
  ('animal-adventure', '動物たちの小さな冒険', '森を駆ける動物たちの一瞬を、物語のように切り取るスタイル。ペットや自然を題材にした紹介にも。', 'animals', '/demo/animal-adventure.jpg', '9:16', false, 9),
  ('sports-moment', '決定的なスポーツシーン', '動きの頂点を鮮やかに見せる。試合のハイライトやチーム紹介に。', 'sports', '/demo/sports-moment.jpg', '9:16', false, 10)
on conflict (slug) do nothing;

commit;
