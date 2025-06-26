/*************************************************
 * 1) Supabase 初期化
 *************************************************/
const supabaseUrl = 'https://iokuochhrkizhyvlwszv.supabase.co';      // ←ご自身の値
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlva3VvY2hocmtpemh5dmx3c3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTIzMjksImV4cCI6MjA2NTYyODMyOX0.NjTLvYrMyAXEgMYhohtFh9b8sN8qpyOSxLk2RzLOUPA';                   // ←ご自身の値
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

/*************************************************
 * 2) SPA ルーター
 *************************************************/
window.addEventListener('hashchange', router);
window.addEventListener('load', router);

async function router(){
  const path = location.hash.slice(2) || 'map';
  const view = document.getElementById('view');
  switch(path){
    case 'map':        return renderMap(view);
    case 'communities':return renderCommunities(view);
    case 'events':     return renderEvents(view);
    case 'blog':       return renderBlog(view);
    case 'people':     return renderPeople(view);
    default:           view.textContent = '404 Not Found';
  }
}

/*************************************************
 * 3) 人工島マップページ
 *************************************************/
async function renderMap(root){
  /* マーカー座標 (% 表記) をここで定義
     left / top は画像左上基準の割合（0〜100）
     必要に応じて微調整してください */
  const markers = [
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
