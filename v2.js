'use strict';
// Expansão V2: compatível com saves da V1. Torneios e premiações são ficcionais/simplificados.
const V2_INTERNATIONAL=[
['Real Madrid','ES','Europa','#ffffff','#e6c85a'],['Barcelona','ES','Europa','#9d153e','#16499b'],['Atlético de Madrid','ES','Europa','#d42c3b','#ffffff'],['Manchester City','EN','Europa','#80bce9','#ffffff'],['Liverpool','EN','Europa','#d32136','#ffffff'],['Arsenal','EN','Europa','#d42c3b','#ffffff'],['Chelsea','EN','Europa','#2454b6','#ffffff'],['Manchester United','EN','Europa','#d32332','#171717'],['Bayern de Munique','DE','Europa','#d92938','#ffffff'],['Borussia Dortmund','DE','Europa','#e8ce23','#111111'],['PSG','FR','Europa','#182c6a','#d42337'],['Inter de Milão','IT','Europa','#2364bd','#111111'],['Milan','IT','Europa','#c32b35','#161616'],['Juventus','IT','Europa','#eeeeee','#111111'],['Napoli','IT','Europa','#3188d6','#ffffff'],['Benfica','PT','Europa','#c72b34','#ffffff'],['Porto','PT','Europa','#2873bf','#ffffff'],['Sporting','PT','Europa','#238050','#ffffff'],['Ajax','NL','Europa','#ffffff','#d52b35'],['Feyenoord','NL','Europa','#d42d34','#ffffff'],
['River Plate','AR','América do Sul','#eeeeee','#d62733'],['Boca Juniors','AR','América do Sul','#1d3977','#f1cc32'],['Racing','AR','América do Sul','#73bde5','#ffffff'],['Independiente','AR','América do Sul','#d12a35','#ffffff'],['Peñarol','UY','América do Sul','#efce26','#151515'],['Nacional','UY','América do Sul','#ffffff','#2454a4'],['Olimpia','PY','América do Sul','#eeeeee','#171717'],['Cerro Porteño','PY','América do Sul','#c92d37','#2556ad'],['Colo-Colo','CL','América do Sul','#f2f2f2','#111111'],['Atlético Nacional','CO','América do Sul','#1a7846','#ffffff'],['LDU Quito','EC','América do Sul','#eeeeee','#1a6a42']
];
for(const [name,stateCode,division,primary,secondary] of V2_INTERNATIONAL){if(!club(name))CLUBS.push({name,state:stateCode,division,primary,secondary})}
const NATIONAL_TEAMS=['Brasil','Argentina','França','Espanha','Inglaterra','Alemanha','Portugal','Itália','Uruguai','Colômbia','Japão','México','Estados Unidos','Marrocos','Holanda','Bélgica','Croácia'];
const V2_COMPETITIONS=['Champions League','Copa Libertadores','Copa do Mundo'];
const isEurope=n=>club(n)?.division==='Europa';
const isSouthAmerica=n=>!!club(n)&&!isEurope(n);
const v2Date=(year,month,day)=>`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
const v2SafeNum=(n,defaultValue)=>Number.isFinite(+n)?+n:defaultValue;
function ensureV2(){if(!state)return;const p=state.player;
 if(!state.v2)state.v2={awards:[],international:{caps:0,goals:0,assists:0},interviews:[],rivalry:{name:'',intensity:0},contract:{club:p.club,salary:12000,expires:state.year+2,bonuses:0},captain:false,captainSince:null,academy:p.age<=17,academyGraduated:p.age>17,seasonStats:{},nationality:'Brasil',mediaLast:'',continentalResults:[],offerSalaries:{},seasonAwardYear:state.year-1};
 const v=state.v2;
 if(!v.awards)v.awards=[];if(!v.international)v.international={caps:0,goals:0,assists:0};if(!v.interviews)v.interviews=[];if(!v.rivalry)v.rivalry={name:'',intensity:0};if(!v.contract)v.contract={club:p.club,salary:12000,expires:state.year+2,bonuses:0};if(!v.seasonStats)v.seasonStats={};if(!v.continentalResults)v.continentalResults=[];if(!v.offerSalaries)v.offerSalaries={};if(!v.nationality)v.nationality='Brasil';
 if(!state.groups)state.groups=makeLeagueNames();if(!state.tables)state.tables={};for(const d of ['Europa','América do Sul']){const key=d==='Europa'?'Liga Europeia':'Liga Sul-Americana';if(!state.groups[key])state.groups[key]=CLUBS.filter(c=>c.division===d).map(c=>c.name);if(!state.tables[key])state.tables[key]=makeTable(state.groups[key])}
 for(const comp of V2_COMPETITIONS){if(comp==='Champions League')state.groups[comp]=CLUBS.filter(c=>c.division==='Europa').map(c=>c.name);else if(comp==='Copa Libertadores')state.groups[comp]=CLUBS.filter(c=>c.division==='A'||c.state==='AR'||c.state==='UY'||c.state==='PY'||c.state==='CL'||c.state==='CO'||c.state==='EC').map(c=>c.name);else state.groups[comp]=NATIONAL_TEAMS.slice();if(!state.tables[comp])state.tables[comp]=makeTable(state.groups[comp]);}
 if(!v.rivalry.name){const opp=CLUBS.filter(c=>c.name!==p.club&&c.state===club(p.club)?.state);v.rivalry.name=opp.length?pick(opp).name:'Um adversário histórico';v.rivalry.intensity=20}
}
function v2Stats(){ensureV2();const y=String(state.year);return state.v2.seasonStats[y]||(state.v2.seasonStats[y]={apps:0,goals:0,assists:0,ratings:[]})}
function v2ExtraFixtures(start){const p=state.player,team=p.club,v=state.v2;const dates=[];
 const comp=isEurope(team)?'Champions League': 'Copa Libertadores';const eligible=isEurope(team)?true:(club(team)?.division==='A'||['AR','UY','PY','CL','CO','EC'].includes(club(team)?.state));
 if(eligible){const opponents=state.groups[comp].filter(n=>n!==team);for(let i=0;i<6&&opponents.length;i++){const opp=opponents[(i*5+state.year)%opponents.length];const day=34+i*33;dates.push({date:plusDays(start,day),comp,home:i%2===0?team:opp,away:i%2===0?opp:team,round:i+1,played:false})}}
 // A Copa do Mundo é disputada a cada 4 anos (2026, 2030...).
 if(state.year%4===2&&calcOvr()>=68){const opponents=NATIONAL_TEAMS.filter(n=>n!==v.nationality);for(let i=0;i<3;i++){const opp=opponents[(i*5+state.year)%opponents.length];dates.push({date:v2Date(state.year,6,12+i*7),comp:'Copa do Mundo',home:i%2===0?v.nationality:opp,away:i%2===0?opp:v.nationality,round:i+1,played:false,national:true})}}
 return dates;
}
function v2InjectFixtures(){ensureV2();const existing=new Set(state.fixtures.map(f=>[f.date,f.comp,f.home,f.away].join('|')));for(const f of v2ExtraFixtures(`${state.year}-01-05`)){if(f.date<state.date)continue;const key=[f.date,f.comp,f.home,f.away].join('|');if(!existing.has(key))state.fixtures.push(f)}state.fixtures.sort((a,b)=>a.date.localeCompare(b.date));}
function v2Create(){ensureV2();v2InjectFixtures();if(state.player.age<=17){addNews('🌱 Categorias de base',`${state.player.name} começa como promessa da base do ${state.player.club}. Treine para conquistar seu lugar entre os profissionais.`)}else addNews('⭐ Nova jornada',`${state.player.name} inicia a caminhada rumo às maiores premiações do futebol.`);save()}
const v2OriginalMakeLeagues=makeLeagueNames;makeLeagueNames=function(){const groups=v2OriginalMakeLeagues();for(const d of ['Europa','América do Sul'])groups[d==='Europa'?'Liga Europeia':'Liga Sul-Americana']=CLUBS.filter(c=>c.division===d).map(c=>c.name);return groups};
const v2OriginalBuild=buildCareer;
buildCareer=function(data){v2OriginalBuild(data);ensureV2();state.v2.nationality=($('nationalityInput')?.value||'Brasil');v2Create();render()};
const v2OriginalNextSeason=nextSeason;
nextSeason=function(){if(state){ensureV2();v2SeasonAwards();}v2OriginalNextSeason();ensureV2();v2InjectFixtures();if(state.v2.contract.expires<=state.year){state.v2.contract.expires=state.year+1;state.v2.contract.salary=Math.round(state.v2.contract.salary*1.09);addNews('Contrato prorrogado',`O ${state.player.club} renovou o contrato por mais uma temporada.`)}if(state.player.age>=18&&!state.v2.academyGraduated){state.v2.academyGraduated=true;addNews('🌱 Estreia no profissional',`${state.player.name} deixa oficialmente as categorias de base!`)}state.v2.captain=false;v2CaptainCheck();save()};
const v2OriginalTransfer=transfer;
transfer=function(to){ensureV2();v2OriginalTransfer(to);ensureV2();const salary=state.v2.offerSalaries[to]||Math.round(state.v2.contract.salary*(1.15+Math.random()*.6));state.v2.contract={club:to,salary,expires:state.year+rand(2,4),bonuses:0};state.v2.captain=false;state.v2.rivalry={name:'',intensity:0};v2InjectFixtures();addNews('💼 Novo contrato',`${state.player.name} assina com ${to} por R$ ${salary.toLocaleString('pt-BR')} mensais.`);save();render()};
const v2OriginalGenerateOffer=generateOffer;
generateOffer=function(force){const old=state.offers.map(o=>o.to);v2OriginalGenerateOffer(force);ensureV2();for(const offer of state.offers){const dest=offer.to||offer.club||offer.team;if(dest&&!old.includes(dest)&&!state.v2.offerSalaries[dest])state.v2.offerSalaries[dest]=Math.round(state.v2.contract.salary*(1.1+Math.random()*.75))}};
function v2CaptainCheck(){const p=state.player,v=state.v2;if(!v.captain&&p.apps>=12&&p.moraleCoach>=78&&calcOvr()>=69){v.captain=true;v.captainSince=state.year;addNews('🎖️ NOVO CAPITÃO!',`O treinador entrega a braçadeira de capitão a ${p.name} no ${p.club}.`)}}
function v2SeasonAwards(){const v=state.v2,y=state.year;if(v.seasonAwardYear===y)return;v.seasonAwardYear=y;const s=v.seasonStats[String(y)]||{apps:0,goals:0,assists:0,ratings:[]};if(!s.apps)return;const avg=s.ratings.length?s.ratings.reduce((a,b)=>a+b,0)/s.ratings.length:6;const p=state.player;const grant=(name)=>{if(v.awards.some(a=>a.year===y&&a.name===name))return;v.awards.push({year:y,name,club:p.club});addNews('🏅 '+name,`${p.name} recebeu o prêmio de ${name} na temporada ${y}!`)};
 if(s.goals>=10)grant('Artilheiro da temporada');if(s.assists>=8)grant('Líder de assistências');if(avg>=7.1&&s.apps>=12)grant('Melhor jogador da temporada');if(p.age<=21&&s.apps>=8&&avg>=6.8)grant('Revelação do ano');if(s.apps>=18&&s.goals>=14&&avg>=7.4&&calcOvr()>=78)grant('Bola de Ouro');}
const v2OriginalFinish=finishMatch;
finishMatch=function(h,a,actions={goals:0,assists:0,success:0,participated:true}){const f=currentFixture();if(!f)return;ensureV2();const before=state.player.ratings.length;const p=state.player;v2OriginalFinish(h,a,actions);const v=state.v2,st=v2Stats();st.apps++;st.goals+=actions.goals||0;st.assists+=actions.assists||0;if(p.ratings.length>before)st.ratings.push(p.ratings[p.ratings.length-1]);
 if(f.national){v.international.caps++;v.international.goals+=actions.goals||0;v.international.assists+=actions.assists||0;addNews('🌍 Seleção em campo',`${v.nationality} disputou partida da Copa do Mundo: ${f.home} ${h} x ${a} ${f.away}.`)}
 if(f.comp==='Champions League'||f.comp==='Copa Libertadores')v.continentalResults.push({year:state.year,comp:f.comp,score:`${f.home} ${h} × ${a} ${f.away}`});
 const pay=Math.round(v.contract.salary/4)+(actions.goals||0)*1400+(actions.assists||0)*800;v.contract.bonuses+=pay;
 if(rand(1,100)<=13){v.rivalry.intensity=clamp(v.rivalry.intensity+rand(4,12));addNews('⚔️ Rivalidade cresce',`A rivalidade com ${v.rivalry.name} ganhou novos capítulos.`)}
 v2CaptainCheck();v2SeasonAwardsOnlyWhenFinished();save();render()};
function v2SeasonAwardsOnlyWhenFinished(){if(!currentFixture())v2SeasonAwards()}
const v2OriginalNextDay=nextDay;
nextDay=function(){if(!state)return;v2OriginalNextDay();ensureV2();v2InjectFixtures();v2CaptainCheck();save();render()};
// Campo 2D com movimentação independente de jogadores e bola durante o tempo de partida.
let v2PitchStep=0;
function v2DrawPitch(){if(!live)return;const el=$('fieldPlayers'),ball=$('movingBall');if(!el||!ball)return;if(!el.children.length){for(let side=0;side<2;side++)for(let i=0;i<7;i++){const d=document.createElement('span');d.className='field-player '+(side?'away':'home')+(i===3&&!side?' hero':'');el.appendChild(d)}}
 const m=live.minute;const phase=Math.sin((m+v2PitchStep)/11);const players=Array.from(el.children);
 players.forEach((node,i)=>{const side=i>=7?1:0;const index=i%7;const baseX=side?66:34;const dx=Math.sin((m*0.22)+(i*2.7))*11+phase*12;const y=10+(index*13)+Math.cos(m*.19+i*1.9)*4;node.style.left=clamp(baseX+dx,7,93)+'%';node.style.top=clamp(y,8,92)+'%'});
 ball.style.left=clamp(50+Math.sin(m*.28)*35,5,95)+'%';ball.style.top=clamp(50+Math.sin(m*.18+1)*33,8,92)+'%';v2PitchStep++;
}
const v2OriginalRenderLive=renderLive;
renderLive=function(){v2OriginalRenderLive();v2DrawPitch()};
const v2OriginalBeginMatch=beginMatch;
beginMatch=function(){v2PitchStep=0;$('fieldPlayers').innerHTML='';v2OriginalBeginMatch();v2DrawPitch()};
function v2AwardList(){const a=state.v2.awards;return a.length?a.slice().reverse().map(x=>`<span class="v2-tag">🏅 ${esc(x.name)} • ${x.year}</span>`).join(''):'<p class="muted">Ainda sem prêmios individuais. Destaque-se em campo para conquistar reconhecimentos.</p>'}
function v2RenderGlory(){ensureV2();const p=state.player,v=state.v2,st=v2Stats(),comp=isEurope(p.club)?'Champions League':'Copa Libertadores';
 $('awardsInfo').innerHTML=`<div class="v2-grid"><div class="v2-stat"><strong>${v.awards.length}</strong>Prêmios individuais</div><div class="v2-stat"><strong>${st.goals}</strong>Gols nesta temporada</div><div class="v2-stat"><strong>${st.assists}</strong>Assistências na temporada</div></div>${v2AwardList()}<p class="v2-subtle">Prêmios são avaliados por estatísticas ao fim da temporada.</p>`;
 const worldCup=state.year%4===2;const called=calcOvr()>=68;
 $('nationalInfo').innerHTML=`<div class="v2-card"><h4>🇧🇷 ${esc(v.nationality)}</h4><p>${v.international.caps} jogos • ${v.international.goals} gols • ${v.international.assists} assistências</p><p>${called?'Você tem nível para ser convocado.':'Chegue ao overall 68 para concorrer à convocação.'}</p><p>${worldCup?'🏆 Ano de Copa do Mundo':'Próxima Copa do Mundo: '+(state.year+(2-state.year%4+4)%4)}</p><p class="v2-subtle">Calendário fictício de seleções; os jogos da Copa surgem no calendário quando você atende aos requisitos.</p></div>`;
 const continental=state.fixtures.filter(f=>f.comp===comp);$('continentalInfo').innerHTML=`<div class="v2-card"><h4>🏆 ${comp}</h4><p>${continental.length?continental.filter(f=>f.played).length+' de '+continental.length+' partidas disputadas':'Seu clube ainda não está classificado para esta competição.'}</p><p>${v.continentalResults.slice(-3).map(x=>esc(x.score)).join(' • ')||'Nenhum resultado continental registrado.'}</p></div>`;
 $('captainInfo').innerHTML=`<div class="v2-card"><h4>${v.captain?'🎖️ Você é o capitão!':'Braçadeira ainda não conquistada'}</h4><p>${v.captain?'Lidere o elenco e mantenha a confiança do treinador.':'Requisitos: 12 jogos na carreira, overall 69 e moral com técnico de pelo menos 78.'}</p></div>`;
}
function v2Interview(kind){ensureV2();const v=state.v2,p=state.player;if(v.mediaLast===state.date){alert('Você já concedeu uma entrevista hoje. Avance um dia.');return}const changes={humble:[6,4,-3],confident:[-2,8,8],team:[7,5,-4]}[kind];if(!changes)return;p.moraleCoach=clamp(p.moraleCoach+changes[0]);p.moraleFans=clamp(p.moraleFans+changes[1]);v.rivalry.intensity=clamp(v.rivalry.intensity+changes[2]);v.mediaLast=state.date;const lines={humble:'Ainda tenho muito a aprender.',confident:'Estou pronto para enfrentar qualquer rival!',team:'O grupo está acima de qualquer individualidade.'};v.interviews.unshift({date:state.date,quote:lines[kind]});addNews('🎙️ Coletiva de imprensa',`${p.name} declarou: “${lines[kind]}”`);save();render()}
function v2RenderMedia(){ensureV2();const v=state.v2;const disabled=v.mediaLast===state.date?'disabled':'';
 $('interviewInfo').innerHTML=`<p>Escolha o tom da sua próxima entrevista. Cada resposta afeta a moral e a rivalidade.</p><div class="v2-actions"><button class="secondary" data-interview="humble" ${disabled}>Ser humilde</button><button class="secondary" data-interview="confident" ${disabled}>Provocar rivais</button><button class="secondary" data-interview="team" ${disabled}>Valorizar o elenco</button></div><p class="v2-subtle">${v.mediaLast===state.date?'Você já falou com a imprensa hoje.':'Uma entrevista por dia.'}</p><div>${v.interviews.slice(0,4).map(x=>`<div class="v2-card"><small>${formatDate(x.date)}</small><p>“${esc(x.quote)}”</p></div>`).join('')}</div>`;
 $('rivalryInfo').innerHTML=`<div class="v2-stat"><strong>${esc(v.rivalry.name)}</strong>Rival atual • Intensidade ${v.rivalry.intensity}/100</div><p>Entrevistas e partidas podem aumentar ou diminuir a rivalidade.</p>`;
 $$('[data-interview]').forEach(b=>b.onclick=()=>v2Interview(b.dataset.interview));
}
function v2RenderContract(){ensureV2();const v=state.v2,p=state.player;const c=v.contract;
 $('contractV2').innerHTML=`<div class="v2-grid"><div class="v2-stat"><strong>R$ ${c.salary.toLocaleString('pt-BR')}</strong>Salário mensal fictício</div><div class="v2-stat"><strong>${c.expires}</strong>Fim do contrato</div><div class="v2-stat"><strong>R$ ${c.bonuses.toLocaleString('pt-BR')}</strong>Ganhos acumulados (simulados)</div></div><div class="v2-actions"><button id="renewV2" class="secondary" ${c.expires>=state.year+4?'disabled':''}>📄 Pedir renovação</button></div><p class="v2-subtle">Valores são parte da simulação, sem dinheiro real.</p>`;
 $('renewV2').onclick=()=>{if(p.moraleCoach<55){addNews('Negociação travada',`O ${p.club} não aceitou renegociar neste momento. Melhore sua moral com o técnico.`);alert('O clube quer ver mais comprometimento antes de renovar.');return}c.expires=Math.max(c.expires,state.year+2);c.salary=Math.round(c.salary*1.12);addNews('✍️ Contrato renovado',`${p.name} renova com o ${p.club} até ${c.expires}.`);save();render()};
 const offers=$('offers');if(offers){const rows=offers.querySelectorAll('[data-accept]');rows.forEach(b=>{const dest=state.offers[+b.dataset.accept]?.to;if(dest){const amount=v.offerSalaries[dest]||Math.round(c.salary*1.3);b.title=`Salário estimado: R$ ${amount.toLocaleString('pt-BR')}/mês`}})}
}
function v2RenderHistory(){ensureV2();const v=state.v2;$('historyV2').innerHTML=`<div class="v2-grid"><div class="v2-stat"><strong>${v.international.caps}</strong>Jogos pela seleção</div><div class="v2-stat"><strong>${v.awards.length}</strong>Prêmios individuais</div><div class="v2-stat"><strong>${v.captain?'Sim':'Não'}</strong>Capitão atual</div></div>${v2AwardList()}<h4>Competições internacionais</h4>${v.continentalResults.slice(-12).reverse().map(x=>`<p>⚽ ${esc(x.comp)} ${x.year} • ${esc(x.score)}</p>`).join('')||'<p class="muted">Nenhuma partida internacional ainda.</p>'}`}
const v2OriginalRender=render;
render=function(){if(!state)return;ensureV2();v2OriginalRender();v2RenderGlory();v2RenderMedia();v2RenderContract();v2RenderHistory()};
const v2OriginalRetire=retire;
retire=function(){v2OriginalRetire();if(state?.retired){ensureV2();$('retirementContent').insertAdjacentHTML('beforeend',`<h3>Prêmios individuais</h3>${v2AwardList()}<h3>Seleção</h3><p>${state.v2.international.caps} jogos • ${state.v2.international.goals} gols • ${state.v2.international.assists} assistências</p><h3>Ganhos de carreira (simulados)</h3><p>R$ ${state.v2.contract.bonuses.toLocaleString('pt-BR')}</p>`);save()}};
const v2OriginalRetireSummary=retireSummaryOnLoad;
retireSummaryOnLoad=function(){v2OriginalRetireSummary();ensureV2();$('retirementContent').insertAdjacentHTML('beforeend',`<h3>Prêmios individuais</h3>${v2AwardList()}<h3>Seleção</h3><p>${state.v2.international.caps} jogos • ${state.v2.international.goals} gols</p>`)};
// Atualiza navegação já criada pelo script original.
$$('#nav button').forEach(b=>b.onclick=()=>switchPage(b.dataset.page));
const v2OriginalSwitchPage=switchPage;
switchPage=function(name){v2OriginalSwitchPage(name);if(name==='glory')v2RenderGlory();if(name==='media')v2RenderMedia()};
// Campo de nacionalidade inserido na criação sem interferir no formulário existente.
const nationalitySelect=document.createElement('label');nationalitySelect.className='v2-nationality';nationalitySelect.innerHTML=`Nacionalidade <select id="nationalityInput">${NATIONAL_TEAMS.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('')}</select>`;
const creationForm=$('createForm');if(creationForm){const submit=creationForm.querySelector('button[type="submit"]')||creationForm.querySelector('button');if(submit)submit.before(nationalitySelect);else creationForm.appendChild(nationalitySelect)}
// Inclui clubes internacionais na lista da criação.
$('clubInput').innerHTML=CLUBS.map(c=>`<option value="${esc(c.name)}">${esc(c.name)} — ${c.state} (${c.division.length===1?'Série '+c.division:c.division})</option>`).join('');
if(state){ensureV2();v2InjectFixtures();save();render()}

$('advanceDayBtn').onclick=nextDay; $('retireBtn').onclick=retire; $('playBtn').onclick=beginMatch;
