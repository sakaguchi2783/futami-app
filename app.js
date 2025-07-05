/*************************************************
 * 1) Supabase 初期化
 *************************************************/
const supabaseUrl = 'https://iokuochhrkizhyvlwszv.supabase.co';  // ←差し替え
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlva3VvY2hocmtpemh5dmx3c3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTIzMjksImV4cCI6MjA2NTYyODMyOX0.NjTLvYrMyAXEgMYhohtFh9b8sN8qpyOSxLk2RzLOUPA';                           // ←差し替え
const supabase   = window.supabase.createClient(supabaseUrl, supabaseKey);

/*************************************************
 * 2) ルーター
 *************************************************/
window.addEventListener('hashchange', router);
window.addEventListener('load', router);

async function router(){
  const path = location.hash.slice(2) || 'map';
  const view = document.getElementById('view');
  switch(path){
    case 'map':    return renderMap(view);
    case 'survey': return renderSurvey(view);
    case 'events': return renderEvents(view);
    case 'blog':   return renderBlog(view);
    case 'people': return renderPeople(view);
    default:       view.textContent='404 Not Found';
  }
}

/*************************************************
 * 3) 基本情報ステップ
 *************************************************/
const BASIC_STEPS = [
  { id:'company_size', q:'あなたの会社は何人いますか？',
    opts:['5～10人','11～20人','21～30人','30～50人','50人以上'] },
  { id:'gender',       q:'あなたの性別を教えてください。',
    opts:['男性','女性'] },
  { id:'age_range',    q:'何歳ですか？',
    opts:['18～24歳','25～30歳','31～36歳','36～40歳','41～45歳',
          '46～50歳','51～59歳','60～69歳','70～75歳','75歳以上'] },
];

/*************************************************
 * 4) 男性／女性質問セット（全文）
 *************************************************/
const MALE_Q = [
  { id:'M00', q:'あなたの通勤状況を教えてください。', opts:['車','バイク','電車→徒歩','徒歩','バス']},
  { id:'M01', q:'休憩時間に “あったら嬉しい” スペースはどれですか？',
    opts:['仮眠ポッド（15分睡眠）','マンガ＆マッサージチェアコーナー','集中ワークブース（静音・電源付き）']},
  { id:'M02', q:'人口島に増設してほしいアクティブ施設は？',
    opts:['インドアゴルフレンジ','大浴場・サウナ','24時間トレーニングジム','雀荘施設',
          'バスケット・フットサルコート','釣り桟橋','e-スポーツルーム','その他']},
  { id:'M03', q:'社内あったらいいなと思うアイテムは？',
    opts:['高たんぱくプロテイン／BCAA','エナジードリンク・カフェインガム','湿布や痛み止め薬',
          'ガジェット類（ワイヤレスイヤホン等）','メンズグルーミング（洗顔・ヘアワックス）','スポーツウェア','その他']},
  { id:'M04', q:'“おやつ” を買うなら味の系統は？',
    opts:['チョコ','塩味ナッツ','ハイプロテインチップス','辛口ジャーキー','クッキー','カロリーメイト']},
  { id:'M05', q:'1 回の買い物に許容できる価格帯は？',
    opts:['〜500円','〜1,000円','〜2,000円','2,000円以上']},
  { id:'M06', q:'自身の見た目・コンディションで最も気を遣うところは？',
    opts:['ヘアスタイル','ヒゲ・眉の整え','体脂肪率・筋肉量','体臭・汗ケア','姿勢']},
  { id:'M07', q:'健康サポートで会社に最優先してほしいものは？',
    opts:['定期パーソナルトレーニング補助','メタボ検診＋栄養相談','サウナ・水風呂無料チケット','メンタルヘルス相談窓口']},
  { id:'M08', q:'職場で “もっと評価してほしい” と感じる点は？',
    opts:['リーダーシップ・統率力','問題解決スピード','専門技術・資格','生産性向上アイデア','チームワーク']},
  { id:'M09', q:'3〜5分 の “スキマ講座” が配信されたら観たいテーマは？',
    opts:['筋トレ＆ストレッチ講座','5分でホームページを作るAI講座',
          '人の動きを見て性格診断ができる心理学講座','Excelの使い方講座',
          '株式・暗号資産の基礎','語学フレーズ（英・中・他）']},
  { id:'M10', q:'“がんばりを可視化” するならモチベーションが上がる表彰スタイルは？',
    opts:['レベルアップ式（RPG風）','ポイント→商品交換','月間MVP & 表彰盾','上司・仲間から SNS スタンプ','BBQ招待']},
  { id:'M11', q:'通勤をもっと快適にするサポートで一番嬉しいのは？',
    opts:['無料シャトルバス増便','バイク・自転車通勤手当','フレックス出勤（30分単位）',
          '通勤専用ポッドキャスト（ニュース・英語）']},
  { id:'M12', q:'スキマ時間に楽しみたいリフレッシュは？',
    opts:['自分が見たいドラマ・アニメ・映画が見つかるアプリ','最新スポーツニュース速報',
          '脳トレクイズ','AIを使って休日計画（旅行やトレーニング等）','卓上植物の手入れ']},
  { id:'M13', q:'「新しく始めてもいい」と思う趣味は？',
    opts:['ゴルフ','フィッシング','DIY','ロードバイク','キャンプ','e-スポーツ','投資勉強会','プログラミング（アプリ・ゲーム開発）']},
  { id:'M14', q:'人口島内イベントで、参加したいと思うものは？',
    opts:['スモークBBQ＆クラフトビール祭','砂浜フットサル大会','e-スポーツトーナメント',
          '釣り大会＋海鮮丼フェス','冬の鍋パーティー']},
  { id:'M15', q:'仕事中に感じる主なストレス要因は？',
    opts:['作業ノルマ','騒音・振動','人間関係','夜勤・交代制','腰・肩など身体負荷','その他']},
  { id:'M16', q:'育児・介護などに欲しい支援は？',
    opts:['短時間勤務','在宅併用','休暇延長','社内シェア保育','先輩・後輩社員との情報共有コミュニティ']},
  { id:'M17', q:'「こんなアプリやサービスがあれば便利！」と思うものは？',
    opts:['筋トレ＆食事記録アプリ','株価・仮想通貨ウォッチアプリ','DIY・工具レンタル予約アプリ',
          'こどもの成長アルバム共有アプリ','睡眠スコア×サウナ最適温度ナビ','節約できる貯金アプリ']},
  { id:'M18', q:'性格診断（仕事の適正診断）に興味がありますか？',
    opts:['興味あり','興味なし']},
  { id:'M19', q:'その結果を受け取る方法は？',
    opts:['スマホ通知','LINE公式','社内ポータル','メール','印刷物','YouTube動画']},
  { id:'M20', q:'あなたの勤務形態を教えてください。',
    opts:['工場ライン','技術・バックヤード','事務・総務','その他']},
  { id:'M21', q:'あなたの勤務時間帯を教えてください。',
    opts:['日中勤務','夜間勤務','両方']},
];

const FEMALE_Q = [
  { id:'F00', q:'あなたの通勤状況を教えてください。',
    opts:['車','バイク','電車→徒歩','徒歩','バス']},
  { id:'F00b', q:'社内に常設してほしいアイテム・商品があれば教えてください。',
    opts:['掃除用品','トイレットペーパー','生理用品','化粧品','日焼け止め']},
  { id:'F01', q:'休憩時間に “あったら嬉しい” スペースはどれですか？',
    opts:['パウダールーム（ドライヤー・ライト付き）','ミニコンビニ（お菓子・コスメ）',
          'リラックスラウンジ（ソファ＋観葉植物）','集中できるブース（静音・電源付き）']},
  { id:'F02', q:'社内・EC販売で取り扱ってほしいアイテムを教えてください',
    opts:['美容グッズ（フェイスマスク等）','健康スナック・プロテイン','リラクゼーショングッズ（アロマ、ハンドクリーム）',
          'ファッショングッズ（アクセサリー、靴下）','インナーケア（温活グッズ、サプリ）','その他']},
  { id:'F03', q:'１日の運勢をチェックするとしたら、どの占いが好きですか？',
    opts:['１２星座占い','血液型占い','タロット占い','九星気学','動物占い',
          '身体のタイプ診断から性格診断','見たくない']},
  { id:'F04', q:'占い結果はどの方法で受け取るのが便利ですか？',
    opts:['スマホ通知','LINE公式アカウント','社内ポータル掲示','メール','印刷物','YouTube動画']},
  { id:'F05', q:'自身の見た目で一番コンディションを保ちたい部分は？',
    opts:['肌','ヘアスタイル','メイク持ち','手元（ネイル・乾燥）','姿勢・体型']},
  { id:'F06', q:'職場で「もっと評価・注目してほしい」と感じることを選んでください。',
    opts:['勤務態度（遅刻や休みが無い）','笑顔・雰囲気づくり','仕事のスピード・正確さ',
          'コミュニケーション力','アイデア・改善提案','健康的な体力表彰・KPI設計','ＰＣ知識やプログラミングなどの技術']},
  { id:'F07', q:'月経や更年期など体調変化への会社サポートで、最優先してほしいものは？',
    opts:['休暇・時差出勤','社内フェムテック販売補助','相談窓口・セミナー','体を温めるグッズの常備','汗をケアできるグッズ']},
  { id:'F08', q:'職場の“近隣にポップアップショップ” ができたら、買い物しやすい時間帯は？',
    opts:['始業前','午前休憩','昼休憩','午後休憩','終業後']},
  { id:'F09', q:'「こんなアプリやサービスがあれば毎日がもっと楽しくなる！」というアイデアを教えてください。',
    opts:['1ヶ月分、晩御飯の献立（レシピ）掲載アプリ','お肌お手入れ記録アプリ','子供成長記録アプリ',
          'ヨガ・ピラティスでダイエットアプリ','見たいドラマ・映画・アニメが見つかるアプリ','節約できる家計簿アプリ']},
  { id:'F10', q:'通勤をもっと快適にするなら、どのサポートが一番嬉しいですか？',
    opts:['心が休まる音声アプリ','自転車・徒歩通勤手当','フレックス出勤（30分単位）',
          '通勤時間に聴ける社内ポッドキャスト通勤支援施策','無料シャトルバス増便']},
  { id:'F11', q:'3〜5分の“スキマ時間講座” が配信されたら、どのテーマを観たいですか？',
    opts:['ヨガ・ピラティスダイエット講座','人の動きを見て性格分析できる心理学講座',
          '５分でホームページが作れるAI講座','Excel便利ワザ講座','語学フレーズ（日・英・韓）',
          '美容ストレッチ','お金の基礎知識講座']},
  { id:'F12', q:'仕事の合間にリフレッシュできる“プチアクティビティ”を選ぶなら？',
    opts:['椅子ヨガ','人気韓ドラ ランキング','3分間クイズ大会','アロマディフューザー体験','卓上グリーン（卓上観葉植物）の世話']},
  { id:'F13', q:'“おやつ” を買うなら、味の系統は？',
    opts:['チョコ系','塩味・ナッツ系','フルーツ酸味系','スパイシー系','韓国流行サプリ','高たんぱくプロテイン系']},
  { id:'F14', q:'「今後、自分が趣味にしてもいいな」と思うことを教えてください。',
    opts:['ヨガ・ピラティス','ガーデニング／観葉植物','ダンス・エクササイズ','ボランティア（地域清掃等）','料理','絵画','ゴルフ','写経']},
  { id:'F15', q:'“自分のがんばりを可視化” するなら、どの表彰スタイルがモチベUPする？',
    opts:['デジタルバッジ＋社内SNS投稿','ポイント制 → 商品交換','月間MVP発表会',
          '上司からの手書きメッセージカード','ランチ招待＆フォトセッション認知・評価制度']},
  { id:'F16', q:'社内で受けたい “お金・ライフプラン” セミナーは？',
    opts:['投資超入門（iDeCo/NISA）','家計簿アプリの活用術','保険の基礎と見直し','副業・スキルシェア解説','興味なし']},
  { id:'F17', q:'次の社内や人口島のイベントで、何かテーマを選ぶなら？',
    opts:['春の花見ピクニック','夏のビーチクリーン×BBQ','ハロウィン仮装コンテスト',
          '冬のホットドリンク・マルシェ','地域祭りへの出店']},
  { id:'F18', q:'成長や学びの進捗は、アプリ等でどう表示されるとワクワクしますか？',
    opts:['レベルアップ式（RPG風）','バッジコレクションアルバム','ストーリーマップ（冒険路線図）',
          '実績グラフ（統計可視化）','特に不要']},
  { id:'F19', q:'あなたの勤務形態は？',
    opts:['工場ライン','技術・バックヤード','事務・総務','その他']},
  { id:'F20', q:'仕事中に感じる主なストレス要因は？',
    opts:['人間関係','作業ノルマ','騒音・環境','長時間同姿勢','時間帯勤務','その他']},
  { id:'F21', q:'育児・介護などライフイベント中の働き方で重視する支援は？',
    opts:['短時間勤務','在宅併用','休暇延長','社内保育','情報共有できるコミュニティの存在']},
  { id:'F22', q:'ECショップで１回の買い物に許容できる価格帯は？',
    opts:['〜500円','〜1,000円','〜2,000円','2,000円以上']},
  { id:'F23', q:'あなたの勤務時間帯を教えてください。',
    opts:['日中勤務','夜間勤務','両方']},
];

/*************************************************
 * 5) アンケートページ
 *************************************************/
function renderSurvey(root){
  const answers = {};
  let step = 0;
  let branch = [];

  // コンテナ
  root.innerHTML='<div class="poll-step card" id="poll"></div>';
  const poll = root.querySelector('#poll');

  next();

  function next(){
    if(step < BASIC_STEPS.length){
      ask(BASIC_STEPS[step], saveBasic);
    }else{
      if(branch.length === 0){
        branch = answers.gender==='男性'? MALE_Q : FEMALE_Q;
      }
      const idx = step - BASIC_STEPS.length;
      if(idx < branch.length){
        ask(branch[idx], saveAnswer);
      }else{
        poll.innerHTML='<h3>ご回答ありがとうございました！</h3>';
      }
    }
  }

  /* ---------- 質問表示 ---------- */
  function ask(obj,handler){
    poll.innerHTML=`
      <div class="poll-question">${obj.q}</div>
      <div class="poll-options">
        ${obj.opts.map(o=>`<div class="poll-option">${o}</div>`).join('')}
      </div>`;
    poll.querySelectorAll('.poll-option').forEach(opt=>{
      opt.onclick=()=>handler(obj,opt.textContent);
    });
  }

  /* ---------- 基本3問はローカル保持のみ ---------- */
  function saveBasic(obj,value){
    answers[obj.id]=value;
    step++;next();
  }

  /* ---------- 本質問：保存→集計表示 ---------- */
  async function saveAnswer(obj,value){
    // INSERT
    await supabase.from('survey_responses').insert({
      company_size: answers.company_size,
      gender:       answers.gender,
      age_range:    answers.age_range,
      question_id:  obj.id,
      option_value: value
    });
    // 結果取得
    const { data } = await supabase
      .from('survey_responses')
      .select('option_value',{count:'exact',head:false})
      .eq('question_id',obj.id);

    const total = data.length;
    const counts={}; obj.opts.forEach(o=>counts[o]=0);
    data.forEach(r=>counts[r.option_value]=(counts[r.option_value]||0)+1);

    // 表示
    poll.innerHTML=`
      <div class="poll-question">${obj.q}</div>
      <div class="poll-options">
        ${obj.opts.map(o=>{
          const p= total? Math.round(counts[o]/total*100):0;
          return `<div class="poll-option${o===value?' selected':''}">
                    <div class="poll-bar" style="width:${p}%"></div>
                    ${o}<span class="poll-perc">${p}%</span>
                  </div>`;
        }).join('')}
      </div>`;
    step++; setTimeout(next,1500);
  }
}

/*************************************************
 * 6) 以下：マップ／イベント／ブログ／人探し
 * （以前のコードをそのまま配置、割愛）
 *************************************************/

/* ----- 必要なら renderMap / renderEvents / renderBlog / renderPeople を前回回答から貼り付けてください ----- */


/*************************************************
 * 3) 人工島マップページ
 *************************************************/
async function renderMap(root){
  /* マーカー座標 (% 表記) をここで定義
     left / top は画像左上基準の割合（0〜100）
     必要に応じて微調整してください */
  const markers = [
    {block:'1',  top:45, left:19},
    {block:'2',  top:72, left:11},
    {block:'3',  top:65, left:18},
    {block:'4',  top:65, left:24},
    {block:'5',  top:25, left:32},
    {block:'6',  top:25, left:43},
    {block:'7',  top:38, left:38},
    {block:'8',  top:51, left:38},
    {block:'10', top:61, left:43},
    {block:'14', top:39, left:60},
    {block:'15', top:46, left:60},
    {block:'16', top:55, left:60},
    {block:'17', top:64, left:60},
  ];

  /* HTML */
  root.innerHTML = `
    <h2>人工島地図</h2>
    <p>番号をクリックすると企業一覧を表示します。</p>

    <div class="map-container">
      <img src="map.png" alt="人工島の地図">
      ${markers.map(m=>`
        <button class="marker" data-block="${m.block}" style="top:${m.top}%;left:${m.left}%;">
          ${m.block}
        </button>`).join('')}
    </div>

    <div id="company-list"></div>
  `;

  /* イベント登録 */
  root.querySelectorAll('.marker').forEach(btn=>{
    btn.addEventListener('click', ()=>loadCompanies(btn.dataset.block));
  });

  /* 企業一覧取得 */
  async function loadCompanies(blockNo){
    const listElm = root.querySelector('#company-list');
    listElm.innerHTML = '<p>読み込み中…</p>';

    const {data,error} = await supabase
      .from('companies')
      .select('*')
      .eq('block', blockNo)  // ← テーブル列と合わせる
      .order('name');

    if(error){
      listElm.innerHTML = `<p style="color:red;">${error.message}</p>`;
      return;
    }
    if(!data.length){
      listElm.innerHTML = `<p>ブロック ${blockNo} の登録企業はありません。</p>`;
      return;
    }

    listElm.innerHTML = `
      <h3>ブロック ${blockNo} の企業 (${data.length})</h3>
      ${data.map(c=>`
        <div class="card">
          <h4><a href="${c.url || '#'}" target="_blank" rel="noopener">${c.name}</a></h4>
          <p>${c.industry || ''}</p>
          <p>${c.address || ''}</p>
          <p>TEL: ${c.tel || '-'} / FAX: ${c.fax || '-'}</p>
        </div>`).join('')}
    `;
    /* スクロールして一覧の先頭へ */
    listElm.scrollIntoView({behavior:'smooth'});
  }
}

/*************************************************
 * 4) 以降のページは従来ロジックそのまま
 *************************************************/
async function renderCommunities(root){
  root.innerHTML = `<h2>コミュニティ</h2><div class="grid" id="com-list"></div>`;
  const {data,error} = await supabase.from('communities').select('*').order('name');
  if(error)return root.innerHTML=`<p style="color:red;">${error.message}</p>`;
  root.querySelector('#com-list').innerHTML = data.map(c=>`
    <div class="card">
      <h3>${c.name}</h3>
      <p>${c.description||''}</p>
    </div>`).join('');
}

async function renderEvents(root){
  root.innerHTML = `<h2>イベント</h2><div class="grid" id="evt-list"></div>`;
  const {data,error} = await supabase.from('events').select('*').order('event_date',{ascending:false});
  if(error)return root.innerHTML=`<p style="color:red;">${error.message}</p>`;
  root.querySelector('#evt-list').innerHTML = data.map(e=>`
    <div class="card">
      <h3>${e.title}</h3>
      <time datetime="${e.event_date}">${new Date(e.event_date).toLocaleDateString()}</time>
      <p>${e.description||''}</p>
      <p><strong>場所:</strong> ${e.location||''}</p>
    </div>`).join('');
}

async function renderBlog(root){
  root.innerHTML = `
    <h2>みんなのブログ</h2>
    <form id="blog-form" class="card">
      <h3>新規投稿</h3>
      <label>ハンドルネーム<input name="author" required></label>
      <label>タイトル<input name="title" required></label>
      <label>本文<textarea name="content" rows="5" required></textarea></label>
      <button>投稿</button>
    </form>
    <div id="blog-list"></div>`;

  document.getElementById('blog-form').addEventListener('submit',async e=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const {error} = await supabase.from('blogs').insert({
      author:fd.get('author'),
      title:fd.get('title'),
      content:fd.get('content')
    });
    if(error)return alert(error.message);
    e.target.reset();
    loadBlogs();
  });

  async function loadBlogs(){
    const {data,error} = await supabase.from('blogs').select('*').order('created_at',{ascending:false});
    if(error)return root.querySelector('#blog-list').innerHTML=`<p style="color:red;">${error.message}</p>`;
    root.querySelector('#blog-list').innerHTML = data.map(b=>`
      <div class="card">
        <h3>${b.title}</h3>
        <p style="opacity:.6;font-size:.85em;">${b.author} - ${new Date(b.created_at).toLocaleString()}</p>
        <p>${b.content.replace(/\n/g,'<br>')}</p>
      </div>`).join('');
  }
  loadBlogs();
}

async function renderPeople(root){
  root.innerHTML = `
    <h2>人材・企業探し</h2>
    <form id="req-form" class="card">
      <h3>探している内容を投稿</h3>
      <label>投稿者<input name="author" required></label>
      <label>タイトル<input name="title" required></label>
      <label>詳細<textarea name="description" rows="4" required></textarea></label>
      <button>投稿</button>
    </form>
    <div id="req-list"></div>`;

  document.getElementById('req-form').addEventListener('submit',async e=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const {error} = await supabase.from('people_requests').insert({
      author:fd.get('author'),
      title:fd.get('title'),
      description:fd.get('description')
    });
    if(error)return alert(error.message);
    e.target.reset();
    loadRequests();
  });

  async function loadRequests(){
    const {data,error} = await supabase.from('people_requests')
      .select('*').eq('is_deleted',false).order('created_at',{ascending:false});
    if(error)return root.querySelector('#req-list').innerHTML=`<p style="color:red;">${error.message}</p>`;
    root.querySelector('#req-list').innerHTML = data.map(r=>`
      <div class="card">
        <h3>${r.title}</h3>
        <p style="opacity:.6;font-size:.85em;">${r.author} - ${new Date(r.created_at).toLocaleString()}</p>
        <p>${r.description.replace(/\n/g,'<br>')}</p>
        <button class="btn-delete" data-id="${r.id}">削除</button>
      </div>`).join('');

    root.querySelectorAll('.btn-delete').forEach(btn=>{
      btn.onclick = async ()=>{
        if(!confirm('本当に削除しますか？')) return;
        const {error} = await supabase.from('people_requests')
          .update({is_deleted:true}).eq('id',btn.dataset.id);
        if(error)alert(error.message);
        loadRequests();
      };
    });
  }
  loadRequests();
}
