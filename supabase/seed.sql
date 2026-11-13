-- 下書きを追加。再実行しても編集済みの行は上書きしません。
insert into public.templates (slug,title,description,category,poster_url,aspect_ratio,is_published,sort_order) values
 ('runway-walk', 'ランウェイウォーク', '一歩ごとに、視線を集める。コーディネートのシルエットや質感を印象的に見せるスタイル。', 'fashion', '/demo/runway-walk.jpg', '9:16', false, 0),
 ('floating-product', '浮かぶ商品', '重力から自由になった商品が、主役に。新商品やパッケージの紹介に。', 'product', '/demo/floating-product.jpg', '9:16', false, 1),
 ('sunset-portrait', '夕暮れのポートレート', '夕暮れの光に包まれる、静かな一瞬。日常の記録や人物の紹介に。', 'lifestyle', '/demo/sunset-portrait.jpg', '9:16', false, 2),
 ('cinematic-car', '映画風の車のお披露目', '光と影のコントラストで、存在感を引き出す。車やプロダクトのお披露目に。', 'cinematic', '/demo/cinematic-car.jpg', '9:16', false, 3),
 ('neon-walk', 'ネオン街を歩く', '街の灯りが、いつもの景色を物語に変える。夜の世界観を伝えるリールに。', 'cinematic', '/demo/neon-walk.jpg', '9:16', false, 4),
 ('luxury-bottle', '高級ボトルのお披露目', '輪郭をなぞる光で、細部まで美しく。ボトルやコスメのコンセプト紹介に。', 'product', '/demo/luxury-bottle.jpg', '9:16', false, 5),
 ('dream-room', '夢のような部屋', '想像の中の部屋を、ひとつの世界に。インテリアや暮らしのイメージづくりに。', 'lifestyle', '/demo/dream-room.jpg', '9:16', false, 6),
 ('outfit-switch', 'コーディネート切り替え', '装いが変わる、その瞬間を印象的に。着こなしや季節のスタイリング紹介に。', 'fashion', '/demo/outfit-switch.jpg', '9:16', false, 7),
 ('orbit-object', '不思議な物体の回転', '見慣れた形に、意外な動きを。アートや抽象的な世界観の表現に。', 'effects', '/demo/orbit-object.jpg', '9:16', false, 8)
on conflict (slug) do nothing;
