/** 2026-09-29-v10: Post Generator coordinator. */
import { registerGiveawayPosts } from './posts-giveaway.js?v=2026-09-29-v09';
import { registerMarketplacePosts } from './posts-marketplace.js?v=2026-09-29-v10';
import { registerCardListPosts } from './posts-card-list.js?v=2026-09-29-v10';
export function register(appContext){
function compactGeneratedPostSpacing(value){
    const lines=String(value||"")
      .replace(/\r\n?/g,"\n")
      .split("\n")
      .map(line=>line.replace(/[ \t]+$/g,""));

    const isHeader=line=>{
      const s=String(line||"").trim();
      return /^\([^)]{2,80}\)$/.test(s) ||
        /^【.+】$/.test(s) ||
        /^\[[^\]]+\]$/.test(s) ||
        /^(SOCIALS|HASHTAG\s*:|VIEW MORE OF OUR PRODUCTS\s*:|OTHER PRODUCTS INFO)$/i.test(s);
    };
    const isUrl=line=>/^https?:\/\/\S+$/i.test(String(line||"").trim());
    const isCompact=line=>/^(📩|💰|👥|📍|❌|Instagram:|Facebook:|Carousell Malaysia:|Carousell Singapore:|PRICE\s*:|-【)/i.test(String(line||"").trim());

    const out=[];
    for(const raw of lines){
      const line=raw.trim();
      if(!line){
        if(out.length && out[out.length-1]!=="") out.push("");
        continue;
      }
      if(out.length && out[out.length-1]===""){
        const prev=out[out.length-2]||"";
        if(
          (isHeader(prev) && (isUrl(line)||isCompact(line))) ||
          (isUrl(prev) && isCompact(line)) ||
          (isCompact(prev) && isCompact(line))
        ){
          out.pop();
        }
      }
      out.push(line);
    }

    return out.join("\n")
      .replace(/\n{3,}/g,"\n\n")
      .replace(/\n\n(━{4,})/g,"\n$1")
      .replace(/(━{4,})\n\n/g,"$1\n")
      .trim();
  }

  // One language choice is shared by every generator.  Card metadata and
  // editable fields deliberately remain as entered: translating those could
  // obscure a card's actual printing language or change a seller's wording.
  const POST_LANGUAGE_OPTIONS=Object.freeze([
    ["en","English"],
    ["ms","Bahasa Melayu"],
    ["zh","中文（简体）"],
    ["ja","日本語"],
    ["ko","한국어"]
  ]);

  function normalizePostLanguage(value){
    return POST_LANGUAGE_OPTIONS.some(([code])=>code===value) ? value : "en";
  }

  function getPostGeneratorLanguage(){
    try{return normalizePostLanguage(appContext.localStorage.getItem(appContext.POST_GENERATOR_LANGUAGE_KEY));}
    catch{return "en";}
  }

  function savePostGeneratorLanguage(value){
    const language=normalizePostLanguage(value);
    try{appContext.localStorage.setItem(appContext.POST_GENERATOR_LANGUAGE_KEY,language);}catch{}
    return language;
  }

  function postLanguageSelectHTML(id,selected){
    const language=normalizePostLanguage(selected);
    return `
      <div class="field post-language-field">
        <label for="${id}">Post language</label>
        <select id="${id}">
          ${POST_LANGUAGE_OPTIONS.map(([code,label])=>`<option value="${code}" ${code===language?"selected":""}>${label}</option>`).join("")}
        </select>
        <div class="hint">Changes all generated template wording. Card language, titles and any details you edit stay exactly as entered.</div>
      </div>`;
  }

  function postLocale(value){
    const language=normalizePostLanguage(value);
    const locales={
      en:{
        priceRefer:"PRICE : PLEASE REFER TO OUR WEBSITE",
        nfs:"🚫 NOT FOR SALE — PERSONAL COLLECTION",
        collectionCta:"🌐 VISIT OUR WEBSITE TO SEE MORE FROM OUR COLLECTION:",
        cardDrop:"✨ CARD DROP",
        cardList:"‼️ CARD LIST ‼️",
        moreCards:"More cards are available beyond this drop.",
        browseInventory:"Browse the full inventory:",
        inventory:"AVAILABLE INVENTORY",
        graded:"𝐆𝐑𝐀𝐃𝐄𝐃 𝐒𝐋𝐀𝐁𝐒", raw:"𝐑𝐀𝐖 𝐒𝐈𝐍𝐆𝐋𝐄𝐒", sealed:"𝐒𝐄𝐀𝐋𝐄𝐃 𝐏𝐑𝐎𝐃𝐔𝐂𝐓𝐒",
        dm:"📩 DM your offer if interested", serious:"💰 Serious buyers only", meetup:"👥 Can discuss meetup location", located:"📍 Located in KL 🇲🇾 / SG 🇸🇬", lowball:"❌ No lowball offers",
        cod:"📍 COD / MEETUP: MALAYSIA OR SINGAPORE, DEPENDING ON THE ITEM",
        shippingTitle:"🌏 INTERNATIONAL SHIPPING — BELOW USD 6,000 ONLY",
        shipping:"International shipping is available only for items valued below USD 6,000. Shipping costs and insurance fees will be borne by the buyer. Shipping insurance is optional, but strongly recommended for higher-value shipments. Cards will be packed securely, and a video of the packing process will be provided for buyer's peace of mind. A tracking number will be provided once your package has been shipped. For cards priced above USD 6,000, Cash on Delivery (COD) in Malaysia or Singapore is preferred, depending on the specific card. Please note that we cannot be held responsible for any loss, damage, or issues that may occur during transit once the package has been shipped.",
        winnerAnnouncement:"GIVEAWAY WINNER{plural} ANNOUNCEMENT", results:"The results are in!", congratulations:"Congratulations to:", prize:"Prize", winnerThanks:"Thank you very much to everyone who joined our giveaway and supported Collect TCG MY & SG.", winnerSupport:"We appreciate every follow, like, share, and comment. There will be more giveaways in the future, so keep an eye out for the next one 👀", winnerEnd:"Congratulations once again to {target}! 🎊",
        howToEnter:"📌 HOW TO ENTER:", followFacebook:"FOLLOW our Facebook Page", followInstagram:"FOLLOW our Instagram", comment:"COMMENT on the giveaway post", visitCode:"VISIT our website and find the Giveaway Code", submit:"SUBMIT your entry here", important:"‼️ IMPORTANT:", eligible:"Only participants who complete all required steps will be eligible for the draw.", contactWinner:"📩 HOW THE WINNER WILL BE CONTACTED:", contactWinnerText:"Facebook Pages cannot send the first message to personal accounts. We will reply to the winner’s comment, and the winner must PM our Facebook Page within {hours} hours to claim the prize.", bonus:"⭐ EXTRA ACTIONS / BONUS ENTRIES:", joinGroup:"➕ +1 BONUS: Join our Facebook Group", shareFacebook:"➕ +1 BONUS: Share this Facebook post publicly", tagFriends:"➕ +1 BONUS: Tag 2 friends", shareStory:"➕ +1 BONUS: Share to your IG Story and tag @collecttcg.mysg", groups:"📢 IMPORTANT:", groupsText:"This giveaway post has been shared across multiple groups. All eligible entries from every group will be combined into one single pool for the final draw.", selection:"🎲 WINNER SELECTION:", selectionText:"The winner will be selected randomly using {tool}.", verification:"🔎 WINNER VERIFICATION:", verificationText:"When the winner is announced, we will also include the winner’s Facebook profile URL for transparency and verification purposes.", luck:"🍀 GOOD LUCK, EVERYONE!", ends:"🗓️ GIVEAWAY ENDS", postage:"📦 Postage", explore:"EXPLORE MORE FROM COLLECT TCG",
        carousellNoTrade:"NO TRADE, ONLY SELL", productDetails:"[Product Details]", caution:"[Caution]", importantNotes:"[Important Notes]", codRules:"[COD Rules]"
      },
      ms:{
        priceRefer:"HARGA: SILA RUJUK LAMAN WEB KAMI", nfs:"🚫 BUKAN UNTUK DIJUAL — KOLEKSI PERIBADI", collectionCta:"🌐 LAWATI LAMAN WEB KAMI UNTUK MELIHAT LEBIH BANYAK KOLEKSI:", cardDrop:"✨ JATUHAN KAD", cardList:"‼️ SENARAI KAD ‼️", moreCards:"Lebih banyak kad tersedia selain pilihan ini.", browseInventory:"Lihat inventori penuh:", inventory:"INVENTORI TERSEDIA", graded:"𝐊𝐀𝐃 𝐁𝐄𝐑𝐆𝐑𝐀𝐃", raw:"𝐊𝐀𝐃 𝐌𝐄𝐍𝐓𝐀𝐇", sealed:"𝐏𝐑𝐎𝐃𝐔𝐊 𝐁𝐄𝐑𝐒𝐄𝐆𝐄𝐋", dm:"📩 Hantar DM tawaran anda jika berminat", serious:"💰 Pembeli serius sahaja", meetup:"👥 Lokasi pertemuan boleh dibincangkan", located:"📍 Berada di KL 🇲🇾 / SG 🇸🇬", lowball:"❌ Tiada tawaran melampau rendah", cod:"📍 COD / TEMU JANJI: MALAYSIA ATAU SINGAPURA, BERGANTUNG PADA ITEM", shippingTitle:"🌏 PENGHANTARAN ANTARABANGSA — BAWAH USD 6,000 SAHAJA", shipping:"Penghantaran antarabangsa hanya tersedia untuk item bernilai di bawah USD 6,000. Kos penghantaran dan insurans ditanggung pembeli. Insurans penghantaran adalah pilihan tetapi amat disyorkan untuk item bernilai tinggi. Kad akan dibungkus dengan selamat dan video proses pembungkusan akan diberikan. Nombor penjejakan akan diberikan selepas penghantaran. Untuk kad melebihi USD 6,000, COD di Malaysia atau Singapura adalah pilihan utama. Selepas item dihantar, kami tidak bertanggungjawab atas kehilangan, kerosakan atau isu semasa transit.", winnerAnnouncement:"PENGUMUMAN PEMENANG GIVEAWAY{plural}", results:"Keputusan telah diumumkan!", congratulations:"Tahniah kepada:", prize:"Hadiah", winnerThanks:"Terima kasih kepada semua yang menyertai giveaway kami dan menyokong Collect TCG MY & SG.", winnerSupport:"Kami menghargai setiap follow, like, share dan komen. Akan ada lebih banyak giveaway pada masa akan datang, jadi nantikan yang seterusnya 👀", winnerEnd:"Tahniah sekali lagi kepada {target}! 🎊", howToEnter:"📌 CARA PENYERTAAN:", followFacebook:"IKUTI Halaman Facebook kami", followInstagram:"IKUTI Instagram kami", comment:"TINGGALKAN KOMEN pada pos giveaway", visitCode:"LAWATI laman web kami dan cari Kod Giveaway", submit:"HANTAR penyertaan anda di sini", important:"‼️ PENTING:", eligible:"Hanya peserta yang melengkapkan semua langkah diperlukan layak untuk cabutan.", contactWinner:"📩 CARA PEMENANG AKAN DIHUBUNGI:", contactWinnerText:"Halaman Facebook tidak boleh menghantar mesej pertama kepada akaun peribadi. Kami akan membalas komen pemenang dan pemenang perlu PM Halaman Facebook kami dalam {hours} jam untuk menuntut hadiah.", bonus:"⭐ TINDAKAN TAMBAHAN / PENYERTAAN BONUS:", joinGroup:"➕ BONUS +1: Sertai Kumpulan Facebook kami", shareFacebook:"➕ BONUS +1: Kongsi pos Facebook ini secara umum", tagFriends:"➕ BONUS +1: Tag 2 rakan", shareStory:"➕ BONUS +1: Kongsi ke IG Story dan tag @collecttcg.mysg", groups:"📢 PENTING:", groupsText:"Pos giveaway ini dikongsi dalam beberapa kumpulan. Semua penyertaan yang layak akan digabungkan dalam satu cabutan akhir.", selection:"🎲 PEMILIHAN PEMENANG:", selectionText:"Pemenang akan dipilih secara rawak menggunakan {tool}.", verification:"🔎 PENGESAHAN PEMENANG:", verificationText:"Apabila pemenang diumumkan, URL profil Facebook pemenang juga akan disertakan untuk ketelusan dan pengesahan.", luck:"🍀 SEMOGA BERJAYA!", ends:"🗓️ GIVEAWAY TAMAT", postage:"📦 Pos", explore:"TEROKAI LEBIH BANYAK DARIPADA COLLECT TCG", carousellNoTrade:"TIADA TRADE, JUAL SAHAJA", productDetails:"[Butiran Produk]", caution:"[Perhatian]", importantNotes:"[Nota Penting]", codRules:"[Peraturan COD]"
      },
      zh:{
        priceRefer:"价格：请参考我们的网站", nfs:"🚫 非卖品 — 个人收藏", collectionCta:"🌐 浏览我们的网站，查看更多收藏：", cardDrop:"✨ 卡牌上新", cardList:"‼️ 卡牌清单 ‼️", moreCards:"除本次上新外，还有更多卡牌可供选择。", browseInventory:"浏览完整库存：", inventory:"现货库存", graded:"𝐏𝐒𝐀／评级卡", raw:"𝐔𝐍𝐆𝐑𝐀𝐃𝐄𝐃／裸卡", sealed:"𝐌𝐈𝐍𝐓／密封产品", dm:"📩 如有兴趣，请私信报价", serious:"💰 仅限诚意买家", meetup:"👥 可讨论见面地点", located:"📍 位于吉隆坡 🇲🇾 / 新加坡 🇸🇬", lowball:"❌ 谢绝过低报价", cod:"📍 COD / 面交：马来西亚或新加坡，视商品而定", shippingTitle:"🌏 国际运输 — 仅限低于 USD 6,000 的商品", shipping:"国际运输仅适用于价值低于 USD 6,000 的商品。运费和保险费由买方承担。运输保险为可选项目，但强烈建议高价值商品购买。卡牌将安全包装，并提供包装过程视频。发货后会提供追踪号码。价值高于 USD 6,000 的卡牌优先在马来西亚或新加坡 COD。商品发出后，运输过程中产生的遗失、损坏或问题恕不负责。", winnerAnnouncement:"抽奖中奖者公告{plural}", results:"结果已经揭晓！", congratulations:"恭喜以下得奖者：", prize:"奖品", winnerThanks:"感谢所有参加抽奖并支持 Collect TCG MY & SG 的朋友。", winnerSupport:"我们感谢每一次关注、点赞、分享和评论。未来还会有更多抽奖，请继续关注 👀", winnerEnd:"再次恭喜{target}！🎊", howToEnter:"📌 参与方式：", followFacebook:"关注我们的 Facebook 专页", followInstagram:"关注我们的 Instagram", comment:"在抽奖贴文留言", visitCode:"访问我们的网站并寻找抽奖代码", submit:"在此提交报名", important:"‼️ 重要：", eligible:"只有完成所有必要步骤的参与者才有资格参加抽奖。", contactWinner:"📩 联系中奖者的方式：", contactWinnerText:"Facebook 专页无法主动向个人账号发送第一条消息。我们会回复中奖者的评论，中奖者必须在 {hours} 小时内私信我们的 Facebook 专页领取奖品。", bonus:"⭐ 额外行动 / 奖励次数：", joinGroup:"➕ +1 奖励：加入我们的 Facebook 群组", shareFacebook:"➕ +1 奖励：公开分享此 Facebook 贴文", tagFriends:"➕ +1 奖励：标记 2 位朋友", shareStory:"➕ +1 奖励：分享到 IG Story 并标记 @collecttcg.mysg", groups:"📢 重要：", groupsText:"此抽奖贴文已分享到多个群组。所有符合资格的报名将合并到同一个最终抽奖池。", selection:"🎲 中奖者选择：", selectionText:"中奖者将使用 {tool} 随机选出。", verification:"🔎 中奖者核实：", verificationText:"公布中奖者时，我们也会附上其 Facebook 个人资料链接，以便公开透明和核实。", luck:"🍀 祝大家好运！", ends:"🗓️ 抽奖截止", postage:"📦 邮寄", explore:"探索更多 COLLECT TCG 商品", carousellNoTrade:"不接受交换，仅出售", productDetails:"[商品详情]", caution:"[注意事项]", importantNotes:"[重要说明]", codRules:"[COD 规则]"
      },
      ja:{
        priceRefer:"価格：ウェブサイトをご確認ください", nfs:"🚫 非売品 — 個人コレクション", collectionCta:"🌐 ウェブサイトでコレクションをもっと見る：", cardDrop:"✨ カード入荷", cardList:"‼️ カードリスト ‼️", moreCards:"この掲載以外にも、さらに多くのカードをご用意しています。", browseInventory:"全在庫を見る：", inventory:"販売中の在庫", graded:"𝐆𝐑𝐀𝐃𝐄𝐃 カード", raw:"𝐑𝐀𝐖 カード", sealed:"𝐒𝐄𝐀𝐋𝐄𝐃 商品", dm:"📩 ご興味があればDMでオファーをお送りください", serious:"💰 真剣な購入者のみ", meetup:"👥 待ち合わせ場所は相談可能", located:"📍 KL 🇲🇾 / SG 🇸🇬 所在", lowball:"❌ 大幅な値下げ交渉はご遠慮ください", cod:"📍 COD / 対面取引：商品によりマレーシアまたはシンガポール", shippingTitle:"🌏 国際発送 — USD 6,000 未満の商品限定", shipping:"国際発送は USD 6,000 未満の商品に限ります。送料と保険料は購入者負担です。発送保険は任意ですが、高額商品の場合は強く推奨します。カードは安全に梱包し、梱包動画を提供します。発送後に追跡番号をお知らせします。USD 6,000 を超えるカードは、商品によりマレーシアまたはシンガポールでのCODを優先します。発送後の輸送中の紛失、破損、その他の問題については責任を負いかねます。", winnerAnnouncement:"GIVEAWAY 当選者{plural}発表", results:"結果が出ました！", congratulations:"当選者：", prize:"賞品", winnerThanks:"Giveawayに参加し、Collect TCG MY & SGを応援してくださった皆さま、ありがとうございます。", winnerSupport:"フォロー、いいね、シェア、コメントのすべてに感謝しています。今後もGiveawayを行いますので、次回もお楽しみに 👀", winnerEnd:"{target}の皆さま、改めておめでとうございます！🎊", howToEnter:"📌 参加方法：", followFacebook:"Facebookページをフォロー", followInstagram:"Instagramをフォロー", comment:"Giveaway投稿にコメント", visitCode:"ウェブサイトを訪問してGiveawayコードを見つける", submit:"こちらから応募", important:"‼️ 重要：", eligible:"必要な手順をすべて完了した参加者のみ抽選対象となります。", contactWinner:"📩 当選者への連絡方法：", contactWinnerText:"Facebookページから個人アカウントへ最初のメッセージを送ることはできません。当選者のコメントに返信しますので、当選者は{hours}時間以内にFacebookページへPMでご連絡ください。", bonus:"⭐ 追加アクション / ボーナス応募：", joinGroup:"➕ +1 ボーナス：Facebookグループに参加", shareFacebook:"➕ +1 ボーナス：このFacebook投稿を公開シェア", tagFriends:"➕ +1 ボーナス：友達2人をタグ付け", shareStory:"➕ +1 ボーナス：IGストーリーで @collecttcg.mysg をタグ付けしてシェア", groups:"📢 重要：", groupsText:"このGiveaway投稿は複数のグループで共有されています。すべての有効な応募は、最終抽選のために1つのプールにまとめられます。", selection:"🎲 当選者の選出：", selectionText:"当選者は {tool} を使ってランダムに選出されます。", verification:"🔎 当選者の確認：", verificationText:"当選者発表時には、透明性と確認のため当選者のFacebookプロフィールURLも記載します。", luck:"🍀 幸運を祈ります！", ends:"🗓️ GIVEAWAY 締切", postage:"📦 送料", explore:"COLLECT TCGをもっと見る", carousellNoTrade:"トレード不可・販売のみ", productDetails:"[商品詳細]", caution:"[注意事項]", importantNotes:"[重要事項]", codRules:"[CODルール]"
      },
      ko:{
        priceRefer:"가격: 웹사이트를 확인해 주세요", nfs:"🚫 판매하지 않음 — 개인 컬렉션", collectionCta:"🌐 웹사이트에서 더 많은 컬렉션 보기:", cardDrop:"✨ 카드 드롭", cardList:"‼️ 카드 리스트 ‼️", moreCards:"이번 드롭 외에도 더 많은 카드가 준비되어 있습니다.", browseInventory:"전체 인벤토리 보기:", inventory:"판매 가능 재고", graded:"𝐆𝐑𝐀𝐃𝐄𝐃 카드", raw:"𝐑𝐀𝐖 카드", sealed:"𝐒𝐄𝐀𝐋𝐄𝐃 상품", dm:"📩 관심 있으시면 DM으로 제안해 주세요", serious:"💰 진지한 구매자만", meetup:"👥 만남 장소 협의 가능", located:"📍 KL 🇲🇾 / SG 🇸🇬 위치", lowball:"❌ 터무니없는 가격 제안 사절", cod:"📍 COD / 직거래: 상품에 따라 말레이시아 또는 싱가포르", shippingTitle:"🌏 국제 배송 — USD 6,000 미만 상품만", shipping:"국제 배송은 USD 6,000 미만의 상품에만 가능합니다. 배송비와 보험료는 구매자 부담입니다. 배송 보험은 선택 사항이지만 고가 상품에는 강력히 권장합니다. 카드는 안전하게 포장하며 포장 과정 영상도 제공합니다. 발송 후 운송장 번호를 안내드립니다. USD 6,000 이상의 카드는 상품에 따라 말레이시아 또는 싱가포르에서 COD를 우선합니다. 발송 후 운송 중 발생하는 분실, 파손 또는 기타 문제에 대해서는 책임지지 않습니다.", winnerAnnouncement:"GIVEAWAY 당첨자{plural} 발표", results:"결과가 나왔습니다!", congratulations:"축하드립니다:", prize:"경품", winnerThanks:"Giveaway에 참여하고 Collect TCG MY & SG를 응원해 주신 모든 분들께 진심으로 감사드립니다.", winnerSupport:"팔로우, 좋아요, 공유, 댓글 하나하나에 감사드립니다. 앞으로도 더 많은 Giveaway가 있으니 다음 기회도 기대해 주세요 👀", winnerEnd:"{target} 다시 한번 축하드립니다! 🎊", howToEnter:"📌 참여 방법:", followFacebook:"Facebook 페이지 팔로우", followInstagram:"Instagram 팔로우", comment:"Giveaway 게시물에 댓글 남기기", visitCode:"웹사이트에서 Giveaway 코드를 찾기", submit:"여기에서 응모하기", important:"‼️ 중요:", eligible:"필수 단계를 모두 완료한 참여자만 추첨 대상이 됩니다.", contactWinner:"📩 당첨자 연락 방법:", contactWinnerText:"Facebook 페이지는 개인 계정에 먼저 메시지를 보낼 수 없습니다. 당첨자의 댓글에 답글을 남기며, 당첨자는 {hours}시간 이내에 Facebook 페이지로 PM을 보내 경품을 수령해야 합니다.", bonus:"⭐ 추가 액션 / 보너스 응모:", joinGroup:"➕ +1 보너스: Facebook 그룹 가입", shareFacebook:"➕ +1 보너스: 이 Facebook 게시물을 전체 공개로 공유", tagFriends:"➕ +1 보너스: 친구 2명 태그", shareStory:"➕ +1 보너스: IG 스토리에 공유하고 @collecttcg.mysg 태그", groups:"📢 중요:", groupsText:"이 Giveaway 게시물은 여러 그룹에 공유되었습니다. 모든 유효 응모는 최종 추첨을 위해 하나의 풀로 합쳐집니다.", selection:"🎲 당첨자 선정:", selectionText:"당첨자는 {tool}을 사용하여 무작위로 선정됩니다.", verification:"🔎 당첨자 확인:", verificationText:"당첨자 발표 시 투명성과 확인을 위해 당첨자의 Facebook 프로필 URL도 함께 안내합니다.", luck:"🍀 행운을 빕니다!", ends:"🗓️ GIVEAWAY 마감", postage:"📦 배송", explore:"COLLECT TCG 더 보기", carousellNoTrade:"교환 불가, 판매만", productDetails:"[상품 상세]", caution:"[주의사항]", importantNotes:"[중요 안내]", codRules:"[COD 규정]"
      }
    };
    const shippingPolicy={
      en:{
        shippingTitle:"🌏 WORLDWIDE SHIPPING AVAILABLE",
        shipping:"Worldwide shipping is available. Shipping costs and insurance fees will be borne by the buyer. Shipping insurance is optional, but strongly recommended for higher-value shipments. Cards will be packed securely, and a video of the packing process will be provided for buyer's peace of mind. A tracking number will be provided once your package has been shipped. For high-value items (USD 6,000+), Cash on Delivery (COD) in Malaysia or Singapore is preferred. Secure international shipping may also be considered case by case—please contact us first to discuss payment, delivery, insurance and packing arrangements. Please note that we cannot be held responsible for any loss, damage, or issues that may occur during transit once the package has been shipped."
      },
      ms:{
        shippingTitle:"🌏 PENGHANTARAN SELURUH DUNIA TERSEDIA",
        shipping:"Penghantaran seluruh dunia tersedia. Kos penghantaran dan insurans ditanggung pembeli. Insurans penghantaran adalah pilihan tetapi amat disyorkan untuk item bernilai tinggi. Kad akan dibungkus dengan selamat dan video proses pembungkusan akan diberikan. Nombor penjejakan akan diberikan selepas penghantaran. Untuk item bernilai tinggi (USD 6,000+), COD di Malaysia atau Singapura adalah pilihan utama. Penghantaran antarabangsa yang selamat juga boleh dipertimbangkan mengikut kes—sila hubungi kami terlebih dahulu untuk membincangkan pembayaran, penghantaran, insurans dan urusan pembungkusan. Selepas item dihantar, kami tidak bertanggungjawab atas kehilangan, kerosakan atau isu semasa transit."
      },
      zh:{
        shippingTitle:"🌏 提供全球配送",
        shipping:"提供全球配送。运费和保险费由买方承担。运输保险为可选项目，但强烈建议高价值商品购买。卡牌将安全包装，并提供包装过程视频。发货后会提供追踪号码。对于高价值商品（USD 6,000+），优先在马来西亚或新加坡 COD。也可按个案考虑安全国际运输——请在购买前先联系我们，讨论付款、配送、保险和包装安排。商品发出后，运输过程中产生的遗失、损坏或问题恕不负责。"
      },
      ja:{
        shippingTitle:"🌏 世界各国へ発送可能",
        shipping:"世界各国へ発送可能です。送料と保険料は購入者負担です。発送保険は任意ですが、高額商品の場合は強く推奨します。カードは安全に梱包し、梱包動画を提供します。発送後に追跡番号をお知らせします。高額商品（USD 6,000+）は、マレーシアまたはシンガポールでのCODを優先します。安全な国際発送も個別に検討できますので、購入前に支払い、配送、保険、梱包の手配についてご相談ください。発送後の輸送中の紛失、破損、その他の問題については責任を負いかねます。"
      },
      ko:{
        shippingTitle:"🌏 전 세계 배송 가능",
        shipping:"전 세계 배송이 가능합니다. 배송비와 보험료는 구매자 부담입니다. 배송 보험은 선택 사항이지만 고가 상품에는 강력히 권장합니다. 카드는 안전하게 포장하며 포장 과정 영상도 제공합니다. 발송 후 운송장 번호를 안내드립니다. 고가 상품(USD 6,000+)은 말레이시아 또는 싱가포르에서의 COD를 우선합니다. 안전한 국제 배송도 건별로 검토할 수 있으니, 구매 전에 결제, 배송, 보험 및 포장 절차를 논의하기 위해 먼저 연락해 주세요. 발송 후 운송 중 발생하는 분실, 파손 또는 기타 문제에 대해서는 책임지지 않습니다."
      }
    };
    return {...(locales[language]||locales.en),...(shippingPolicy[language]||shippingPolicy.en)};
  }

  function replacePostTokens(text,values={}){
    return String(text||"").replace(/\{(\w+)\}/g,(_match,key)=>values[key]??"");
  }

  function postSalesFooterLines(language){
    const t=postLocale(language);
    return [t.cod,"",t.shippingTitle,"",t.shipping,"",t.dm,"",t.serious,"",t.meetup,"",t.located,"",t.lowball];
  }

  function facebookGroupSalesCopy(language){
    const copy={
      en:{price:"💰 Price & full details:",shipping:"🌏 Worldwide shipping available",dm:"📩 DM if interested or if you would like more photos / video."},
      ms:{price:"💰 Harga & butiran penuh:",shipping:"🌏 Penghantaran seluruh dunia tersedia",dm:"📩 DM jika berminat atau jika anda mahu lebih banyak foto / video."},
      zh:{price:"💰 价格与完整详情：",shipping:"🌏 提供全球配送",dm:"📩 如有兴趣或想查看更多照片 / 视频，请私信。"},
      ja:{price:"💰 価格・詳細：",shipping:"🌏 世界各国へ発送可能",dm:"📩 ご興味がある場合、または追加の写真・動画をご希望の場合はDMください。"},
      ko:{price:"💰 가격 및 전체 정보:",shipping:"🌏 전 세계 배송 가능",dm:"📩 관심이 있거나 추가 사진 / 영상을 원하시면 DM 주세요."}
    };
    return copy[normalizePostLanguage(language)]||copy.en;
  }

  function facebookGroupSalesFooterLines(language){
    const t=postLocale(language);
    const short=facebookGroupSalesCopy(language);
    return [t.cod,"",short.shipping,"",short.dm,"",t.meetup,"",t.located];
  }

function normalizePostHashtags(value){
    return String(value||"").trim().toLowerCase();
  }

function getFbPostPrefs(){
    try{
      const parsed = JSON.parse(appContext.localStorage.getItem(appContext.FB_POST_PREFS_KEY) || "{}");
      return {
        carousellShopUrl: appContext.safeHttpUrl(parsed.carousellShopUrl) || appContext.FB_POST_DEFAULTS.carousellShopUrl,
        instagramUrl: appContext.safeHttpUrl(parsed.instagramUrl) || appContext.FB_POST_DEFAULTS.instagramUrl,
        hashtags: normalizePostHashtags(parsed.hashtags || appContext.FB_POST_DEFAULTS.hashtags).slice(0,500)
      };
    }catch{
      return {...appContext.FB_POST_DEFAULTS};
    }
  }

function saveFbPostPrefs(prefs){
    try{
      appContext.localStorage.setItem(appContext.FB_POST_PREFS_KEY, JSON.stringify({
        carousellShopUrl:appContext.safeHttpUrl(prefs.carousellShopUrl) || appContext.FB_POST_DEFAULTS.carousellShopUrl,
        instagramUrl:appContext.safeHttpUrl(prefs.instagramUrl) || appContext.FB_POST_DEFAULTS.instagramUrl,
        hashtags:normalizePostHashtags(prefs.hashtags).slice(0,500)
      }));
    }catch{}
  }

function getFbCardMeta(){
    try{
      const parsed = JSON.parse(appContext.localStorage.getItem(appContext.FB_POST_CARD_META_KEY) || "{}");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    }catch{
      return {};
    }
  }

function saveFbCardMeta(meta){
    try{ appContext.localStorage.setItem(appContext.FB_POST_CARD_META_KEY, JSON.stringify(meta)); }catch{}
  }

function safeHttpUrl(value){
    const raw=String(value||"").trim().slice(0,1000);
    if(!raw) return "";
    try{
      const u=new URL(raw);
      return ["http:","https:"].includes(u.protocol) ? u.toString() : "";
    }catch{
      return "";
    }
  }

function openSafeExternalUrl(value){
    const raw=String(value||"").trim().slice(0,4096);
    if(!raw) return null;

    try{
      const url=new URL(raw);
      if(!["http:","https:"].includes(url.protocol)) return null;
      return window.open(url.toString(),"_blank","noopener,noreferrer");
    }catch{
      return null;
    }
  }

function fbFormatLabel(card){
    const grades = Array.isArray(card?.grading) ? card.grading.filter(g=>g && g.company) : [];
    if(grades.length){
      return `${String(grades[0].company || "").toUpperCase()} ${String(grades[0].grade || "").trim()}`.trim();
    }
    const format = appContext.effectiveFormat(card || {});
    if(appContext.normalizeFilterValue(format) === "sealed") return "SEALED";
    if(appContext.normalizeFilterValue(format) === "graded") return "GRADED";
    return appContext.rawConditionPostLabel(card);
  }

function postEraLabel(card){
    const era=String(card?.era||"").trim();
    return era ? `【${era.toUpperCase()}】` : "";
  }

function postPopLabel(card){
    const grades=Array.isArray(card?.grading)
      ? card.grading.filter(g=>g && String(g.company||"").trim())
      : [];

    if(!grades.length) return "";

    if(grades.length===1){
      const pop=grades[0]?.pop_count;
      if(pop==null || pop==="") return "";
      const n=Number(pop);
      if(!Number.isFinite(n)) return "";
      return `【POP ${Math.round(n).toLocaleString()}】`;
    }

    const pops=grades
      .map((g,index)=>{
        const pop=g?.pop_count;
        if(pop==null || pop==="") return "";
        const n=Number(pop);
        if(!Number.isFinite(n)) return "";
        return `S${index+1} POP ${Math.round(n).toLocaleString()}`;
      })
      .filter(Boolean);

    return pops.length ? `【${pops.join(" · ")}】` : "";
  }

function fbGameLabel(card){
    const game = String(card?.game || "").trim();
    if(appContext.normalizeFilterValue(game) === "one piece card game") return "ONE PIECE";
    return game.toUpperCase();
  }

function defaultFbPostTitle(card){
    if(!card) return "";
    const game=appContext.fbGameLabel(card);
    const parts = [
      card.year || "",
      appContext.normalizeFilterValue(card.era) === "vintage" && appContext.normalizeFilterValue(card.game).includes("one piece") ? "CARDDASS" : "",
      card.series || "",
      card.name || "",
      card.card_code || ""
    ].filter(Boolean);
    const salesLead=`WTS【${appContext.fbFormatLabel(card)}】${appContext.postPopLabel(card)}${appContext.postEraLabel(card)}`;

    return [game,salesLead,...parts].filter(Boolean).join(" ").replace(/\s+/g," ").trim().toUpperCase();
  }

function singleCardCopyTitle(card){
    if(!card) return "";
    const type=appContext.cardListFormat(card);
    const lead=type==="graded" ? appContext.gradedPostLabel(card) : (type==="sealed" ? "Sealed" : appContext.rawConditionPostLabel(card));
    return [appContext.fbGameLabel(card),lead,card.series,card.name,card.card_code].map(value=>String(value||"").trim()).filter(Boolean).join(" · ");
  }

function defaultFbHashtags(card){
    const game = appContext.normalizeFilterValue(card?.game || "");
    if(game.includes("one piece")){
      return "#tcg #onepiece #onepiecetcg #onepiececardgame #tcgcollector";
    }
    if(game.includes("zatch") || game.includes("gash")){
      return "#tcg #zatchbell #gashbell #carddass #tcgcollector";
    }
    if(game.includes("gundam")){
      return "#tcg #gundam #gundamcardgame #carddass #tcgcollector";
    }
    return "#tcg #tcgcollector";
  }

function buildFbPostText(card, values){
    if(!card) return "";

    const divider = "━━━━━━━━━━━━━━━━━━━━━━━━";
    const text=appContext.postLocale(values.language);
    const title = String(values.title || appContext.defaultFbPostTitle(card)).trim();
    const websiteCardUrl = appContext.getCardShareUrl(card.id);
    const carousellShopUrl = appContext.safeHttpUrl(values.carousellShopUrl);
    const instagramUrl = appContext.safeHttpUrl(values.instagramUrl);
    const hashtags = normalizePostHashtags(values.hashtags || appContext.defaultFbHashtags(card));

    const groupFriendly=values.templateMode!=="detailed";
    const groupCopy=appContext.facebookGroupSalesCopy(values.language);
    const lines = [
      title,
      "",
      groupCopy.price,
      "",
      websiteCardUrl,
      "",
      divider,
      "",
      ...(groupFriendly
        ? appContext.facebookGroupSalesFooterLines(values.language)
        : appContext.postSalesFooterLines(values.language)),
      "",
      divider
    ];

    lines.push(
      "",
      "HASHTAG :",
      hashtags
    );

    return appContext.compactGeneratedPostSpacing(lines.join("\n"));
  }

function buildFbNfsPostText(card,values){
    if(!card) return "";

    const divider="━━━━━━━━━━━━━━━━━━━━━━━━";
    const text=appContext.postLocale(values.language);
    const title=String(values.title||appContext.defaultFbPostTitle(card)).trim();
    const collectionUrl=`${location.origin}${location.pathname}${location.search}#/collection`;
    const hashtags=normalizePostHashtags(values.hashtags||appContext.defaultFbHashtags(card));

    const lines=[
      title,
      "",
      text.nfs,
      "",
      text.collectionCta,
      collectionUrl,
      "",
      divider,
      "",
      "HASHTAG :",
      hashtags
    ];

    return appContext.compactGeneratedPostSpacing(lines.join("\n"));
  }

async function copyTextToClipboard(text){
    const value=String(text||"");
    if(!value) return false;

    try{
      await navigator.clipboard.writeText(value);
      return true;
    }catch{
      try{
        const ta=document.createElement("textarea");
        ta.value=value;
        ta.setAttribute("readonly","");
        ta.style.position="fixed";
        ta.style.opacity="0";
        document.body.appendChild(ta);
        ta.select();
        const ok=document.execCommand("copy");
        ta.remove();
        return !!ok;
      }catch{
        return false;
      }
    }
  }

async function copyPlainText(text,successMessage){
    const ok=await appContext.copyTextToClipboard(text);
    appContext.showToast(ok ? (successMessage||"Copied") : "Could not copy");
    return ok;
  }

function postGeneratorCardPricePreview(card){
    if(!card) return "Please inquire";
    const pieces=[];
    if(appContext.hasListedPrice(card.price_myr)) pieces.push(appContext.fmtMYR(card.price_myr));
    if(appContext.hasListedPrice(card.price_usd ?? card.price)){
      pieces.push(`${Math.round(Number(card.price_usd ?? card.price)).toLocaleString("en-US")} USD`);
    }
    if(appContext.hasListedPrice(card.price_sgd)) pieces.push(appContext.fmtSGD(card.price_sgd));
    return pieces.length ? pieces.join(" / ") : "Please inquire";
  }

function currentFacebookToolMode(){
    const mode=appContext.currentHashParams().get("mode");
    return ["single","nfs","list","giveaway","winner","carousell","ebay"].includes(mode) ? mode : "single";
  }

function facebookToolsHeaderHTML(mode){
    const descriptions={
      single:"Create a ready-to-post Facebook listing for one card.",
      nfs:"Create a showcase post for one Not For Sale card from your personal collection.",
      list:"Create a complete Facebook sales list from your available inventory.",
      giveaway:"Create a reusable Facebook giveaway post from your giveaway template.",
      winner:"Create a winner-announcement post from your saved Past Winners.",
      carousell:"Create a ready-to-copy Carousell listing description from your card inventory.",
      ebay:"Create an eBay-ready title, item specifics and listing description from one inventory card, with its listing photos ready to download."
    };

    return appContext.compactGeneratedPostSpacing(`
      <div class="page-head fb-tools-page-head">
        <div>
          <div class="eyebrow">Owner Tools</div>
          <h2>Post Generator Tools</h2>
          <p>${appContext.escapeHtml(descriptions[mode]||descriptions.single)}</p>
        </div>
      </div>
      <div class="fb-tools-switcher" role="tablist" aria-label="Post generator type">
        <a href="#/fb-tools?mode=single"
           class="fb-tools-switch ${mode==="single" ? "active" : ""}"
           role="tab"
           aria-selected="${mode==="single" ? "true" : "false"}">
          <span class="fb-tools-switch-icon">▣</span>
          <span>
            <strong>Single Card Post</strong>
            <small>Choose one card · copy post · download all images as ZIP (Sold listings get a SOLD marker automatically)</small>
          </span>
        </a>

        <a href="#/fb-tools?mode=nfs"
           class="fb-tools-switch ${mode==="nfs" ? "active" : ""}"
           role="tab"
           aria-selected="${mode==="nfs" ? "true" : "false"}">
          <span class="fb-tools-switch-icon">◇</span>
          <span>
            <strong>Single Card NFS Post</strong>
            <small>Choose one Collection (NFS) card · showcase it · invite visitors to see more of the collection</small>
          </span>
        </a>

        <a href="#/fb-tools?mode=list"
           class="fb-tools-switch ${mode==="list" ? "active" : ""}"
           role="tab"
           aria-selected="${mode==="list" ? "true" : "false"}">
          <span class="fb-tools-switch-icon">☷</span>
          <span>
            <strong>Card List Post</strong>
            <small>Choose available cards · full list · first images ZIP</small>
          </span>
        </a>

        <a href="#/fb-tools?mode=giveaway"
           class="fb-tools-switch ${mode==="giveaway" ? "active" : ""}"
           role="tab"
           aria-selected="${mode==="giveaway" ? "true" : "false"}">
          <span class="fb-tools-switch-icon">🎁</span>
          <span>
            <strong>Giveaway Post</strong>
            <small>Load a giveaway · edit entry links · copy ready-to-post text</small>
          </span>
        </a>

        <a href="#/fb-tools?mode=winner"
           class="fb-tools-switch ${mode==="winner" ? "active" : ""}"
           role="tab"
           aria-selected="${mode==="winner" ? "true" : "false"}">
          <span class="fb-tools-switch-icon">🏆</span>
          <span>
            <strong>Giveaway Winners</strong>
            <small>Select from Past Winners · matched prizes · Facebook links</small>
          </span>
        </a>

        <a href="#/fb-tools?mode=ebay" class="fb-tools-switch ${mode==="ebay" ? "active" : ""}" role="tab" aria-selected="${mode==="ebay" ? "true" : "false"}"><span class="fb-tools-switch-icon">e</span><span><strong>eBay Listing</strong><small>Choose one card · title · item specifics · description · image ZIP</small></span></a>

        <a href="#/fb-tools?mode=carousell"
           class="fb-tools-switch ${mode==="carousell" ? "active" : ""}"
           role="tab"
           aria-selected="${mode==="carousell" ? "true" : "false"}">
          <span class="fb-tools-switch-icon">C</span>
          <span>
            <strong>Carousell Post</strong>
            <small>Choose a card or giveaway prize · edit Product Details · copy listing template</small>
          </span>
        </a>
      </div>
    `);
  }

function renderFacebookToolsPage(){
    if(!appContext.requireOwner("open Facebook tools")) return;

    const mode = appContext.currentFacebookToolMode();

    if(mode==="list"){
      appContext.renderFbCardListGeneratorPage();
    }else if(mode==="nfs"){
      appContext.renderFbPostGeneratorPage(true);
    }else if(mode==="giveaway"){
      appContext.renderFbGiveawayPostGeneratorPage();
    }else if(mode==="winner"){
      appContext.renderGiveawayWinnerPostGeneratorPage();
    }else if(mode==="carousell"){
      appContext.renderCarousellPostGeneratorPage();
    }else if(mode==="ebay"){
      appContext.renderEbayListingGeneratorPage();
    }else{
      appContext.renderFbPostGeneratorPage();
    }

    const existingHead = appContext.view.querySelector(".page-head");
    if(existingHead){
      existingHead.outerHTML = appContext.facebookToolsHeaderHTML(mode);
    }else{
      appContext.view.insertAdjacentHTML("afterbegin", appContext.facebookToolsHeaderHTML(mode));
    }
  }

function renderFbPostGeneratorPage(nfsMode=false){
    if(!appContext.requireOwner("open FB post generator")) return;

    const prefs = appContext.getFbPostPrefs();
    const perCardMeta = appContext.getFbCardMeta();
    const selectableCards = appContext.cards
      .filter(card=>appContext.isLiveLifecycle(card))
      .filter(card=>!nfsMode || appContext.canonicalAvailability(card.availability)==="Collection (NFS)")
      .slice()
      .sort((a,b)=>{
        const aSold = appContext.normalizeFilterValue(a.availability) === "sold" ? 1 : 0;
        const bSold = appContext.normalizeFilterValue(b.availability) === "sold" ? 1 : 0;
        return aSold - bSold || String(a.name || "").localeCompare(String(b.name || ""));
      });

    const fbSingleGameOptions=[...new Set(
      selectableCards.map(card=>String(card.game||"").trim()).filter(Boolean)
    )].sort((a,b)=>a.localeCompare(b));

    const fbSingleStatusOptions=[...new Set(
      selectableCards.map(card=>String(card.availability||"Available").trim()).filter(Boolean)
    )].sort((a,b)=>a.localeCompare(b));

    appContext.view.innerHTML = `
      <div class="page-head fb-post-page-head">
        <div>
          <div class="eyebrow">Owner Tool</div>
          <h2>${nfsMode ? "Facebook NFS Post Generator" : "Facebook Post Generator"}</h2>
          <p>${nfsMode
            ? "Select a Collection (NFS) card and create a showcase post with no sales or pricing language."
            : "Select a card and copy a ready-to-post Facebook sales template."}</p>
        </div>
      </div>

      <div class="fb-post-layout">
        <section class="panel fb-post-builder">
          <div class="fb-post-section-title">
            <div>
              <div class="eyebrow">1 · Select Card</div>
              <h3>Card Details</h3>
            </div>
          </div>

          <div class="fb-card-list-selection-toolbar">
            <div class="field fb-card-list-search-field">
              <label for="fbPostCardSearch">Search cards</label>
              <input id="fbPostCardSearch" type="search" maxlength="100" placeholder="Name, code, series, year…">
            </div>

            <div class="fb-card-list-filter-row">
              <div class="field">
                <label for="fbPostGameFilter">Game</label>
                <select id="fbPostGameFilter">
                  <option value="">All games</option>
                  ${fbSingleGameOptions.map(v=>`<option value="${appContext.escapeHtml(v)}">${appContext.escapeHtml(v)}</option>`).join("")}
                </select>
              </div>
              <div class="field">
                <label for="fbPostStatusFilter">Status</label>
                <select id="fbPostStatusFilter" ${nfsMode ? "disabled" : ""}>
                  ${nfsMode
                    ? `<option value="Collection (NFS)">Collection (NFS)</option>`
                    : `<option value="">All statuses</option>${fbSingleStatusOptions.map(v=>`<option value="${appContext.escapeHtml(v)}">${appContext.escapeHtml(v)}</option>`).join("")}`}
                </select>
              </div>
              <div class="field">
                <label for="fbPostTypeFilter">Type</label>
                <select id="fbPostTypeFilter">
                  <option value="">All types</option>
                  <option value="graded">Graded</option>
                  <option value="raw">Raw</option>
                  <option value="sealed">Sealed</option>
                </select>
              </div>
            </div>
          </div>

          <div class="field">
            <label for="fbPostCardSelect">Card</label>
            <select id="fbPostCardSelect">
              <option value="">Select a card…</option>
            </select>
            <div class="hint" id="fbPostFilterCount"></div>
          </div>

          <div id="fbPostSelectedCard" class="fb-post-selected-card" hidden></div>

          <div class="field">
            <label for="fbPostTitle">Facebook title</label>
            <input id="fbPostTitle" type="text" maxlength="300" placeholder="Generated automatically after selecting a card">
            <div class="hint">The title is generated from the card data, but you can edit it for terms such as FOIL or a specific Carddass series.</div>
          </div>

          ${appContext.postLanguageSelectHTML("fbPostLanguage",appContext.getPostGeneratorLanguage())}

          ${nfsMode ? "" : `
            <div class="field">
              <label for="fbPostTemplateMode">Facebook template</label>
              <select id="fbPostTemplateMode">
                <option value="group">Group-friendly (short)</option>
                <option value="detailed" selected>Detailed listing</option>
              </select>
              <div class="hint">Group-friendly keeps the card link, COD / meetup, worldwide shipping and DM contact while leaving detailed shipping terms on the website.</div>
            </div>`}

          <details class="fb-post-settings">
            <summary>Template links & hashtags</summary>
            <div class="fb-post-settings-body">
              <div class="field">
                <label for="fbPostCarousellShop">Carousell shop URL</label>
                <input id="fbPostCarousellShop" type="url" maxlength="1000" value="${appContext.escapeHtml(prefs.carousellShopUrl)}">
              </div>
              <div class="field">
                <label for="fbPostInstagram">Instagram URL</label>
                <input id="fbPostInstagram" type="url" maxlength="1000" value="${appContext.escapeHtml(prefs.instagramUrl)}">
              </div>
              <div class="field">
                <label for="fbPostHashtags">Hashtags</label>
                <textarea id="fbPostHashtags" rows="3" maxlength="500">${appContext.escapeHtml(prefs.hashtags)}</textarea>
              </div>
            </div>
          </details>
        </section>

        <section class="panel fb-post-output-panel">
          <div class="fb-post-section-title">
            <div>
              <div class="eyebrow">2 · Copy & Post</div>
              <h3>Post Preview</h3>
            </div>
            <div class="fb-post-copy-actions">
              <button type="button" class="btn-ghost" id="fbCopyListingTitleBtn" disabled>Copy Listing Title</button>
              <button type="button" class="btn-ghost" id="fbCopyTitleBtn" disabled>Copy Facebook Title</button>
              <button type="button" class="btn-ghost" id="fbCopyPostBtn" disabled>Copy Full Post</button>
              <button type="button" class="btn-primary fb-prepare-btn" id="fbPreparePostBtn" disabled>Prepare Facebook Post</button>
            </div>
          </div>

          <div class="field"><label for="fbListingTitleOutput">Listing Title</label><input id="fbListingTitleOutput" type="text" readonly placeholder="Select a card to generate the listing title…"><div class="hint">Condition / grade / sealed · series · card name · card code. Empty fields are omitted.</div></div>
          <textarea id="fbPostOutput" class="fb-post-output" readonly placeholder="Select a card to generate the Facebook post…"></textarea>

          <div class="fb-post-bottom-actions">
            <button type="button" class="btn-ghost" id="fbDownloadImageBtn" disabled>Download Images (.ZIP)</button>
            <button type="button" class="btn-ghost" id="fbOpenCardBtn" disabled>Open Card</button>
          </div>
        </section>
      </div>
    `;

    const select = appContext.$("fbPostCardSelect");
    const searchInput = appContext.$("fbPostCardSearch");
    const gameFilter = appContext.$("fbPostGameFilter");
    const statusFilter = appContext.$("fbPostStatusFilter");
    const typeFilter = appContext.$("fbPostTypeFilter");
    const filterCount = appContext.$("fbPostFilterCount");
    const titleInput = appContext.$("fbPostTitle");
    const languageInput = appContext.$("fbPostLanguage");
    const templateModeInput = appContext.$("fbPostTemplateMode");
    const shopInput = appContext.$("fbPostCarousellShop");
    const instagramInput = appContext.$("fbPostInstagram");
    const hashtagsInput = appContext.$("fbPostHashtags");
    const listingTitleOutput = appContext.$("fbListingTitleOutput");
    const output = appContext.$("fbPostOutput");
    const selectedCardMount = appContext.$("fbPostSelectedCard");
    const copyListingTitleBtn = appContext.$("fbCopyListingTitleBtn");
    const copyTitleBtn = appContext.$("fbCopyTitleBtn");
    const copyPostBtn = appContext.$("fbCopyPostBtn");
    const prepareBtn = appContext.$("fbPreparePostBtn");
    const downloadBtn = appContext.$("fbDownloadImageBtn");
    const openCardBtn = appContext.$("fbOpenCardBtn");

    let selectedCard = null;

    function fbSingleMatchesFilters(card){
      const q=appContext.normalizeFilterValue(searchInput.value);
      const game=appContext.normalizeFilterValue(gameFilter.value);
      const status=appContext.normalizeFilterValue(statusFilter.value);
      const type=appContext.normalizeFilterValue(typeFilter.value);

      if(game && appContext.normalizeFilterValue(card.game)!==game) return false;
      if(status && appContext.normalizeFilterValue(card.availability||"Available")!==status) return false;
      if(type && appContext.cardListFormat(card)!==type) return false;

      if(q){
        const hay=[
          card.name,
          card.card_code,
          card.series,
          card.year,
          card.game,
          card.era,
          card.language,
          card.availability
        ].map(v=>appContext.normalizeFilterValue(v)).join(" ");
        if(!hay.includes(q)) return false;
      }
      return true;
    }

    function renderFbSingleCardOptions(){
      const visible=selectableCards.filter(fbSingleMatchesFilters);
      const selectedId=String(select.value||selectedCard?.id||"");

      select.innerHTML=[
        `<option value="">Select a card…</option>`,
        ...visible.map(card=>`
          <option value="${appContext.escapeHtml(card.id)}">
            ${appContext.escapeHtml(`${card.card_code ? card.card_code + " · " : ""}${card.name} · ${card.availability || "Available"}`)}
          </option>
        `)
      ].join("");

      if(selectedId && visible.some(card=>String(card.id)===selectedId)){
        select.value=selectedId;
      }

      filterCount.textContent=nfsMode
        ? `${visible.length} Collection (NFS) card${visible.length===1?"":"s"} shown`
        : `${visible.length} of ${selectableCards.length} cards shown`;
    }

    function currentValues(){
      return {
        title:titleInput.value,
        language:languageInput.value,
        templateMode:templateModeInput?.value||"detailed",
        carousellShopUrl:shopInput.value,
        instagramUrl:instagramInput.value,
        hashtags:hashtagsInput.value
      };
    }

    function persistCurrent(){
      const prefsNow = currentValues();
      appContext.savePostGeneratorLanguage(prefsNow.language);
      appContext.saveFbPostPrefs(prefsNow);

      if(selectedCard){
        const meta = appContext.getFbCardMeta();
        meta[selectedCard.id] = {
          title:String(titleInput.value || "").trim().slice(0,300),
        };
        appContext.saveFbCardMeta(meta);
      }
    }

    function updateOutput(){
      if(!selectedCard){
        listingTitleOutput.value = "";
        output.value = "";
        copyListingTitleBtn.disabled = true;
        copyTitleBtn.disabled = true;
        copyPostBtn.disabled = true;
        prepareBtn.disabled = true;
        downloadBtn.disabled = true;
        return;
      }

      const values = currentValues();
      listingTitleOutput.value = appContext.singleCardCopyTitle(selectedCard);
      output.value = nfsMode
        ? appContext.buildFbNfsPostText(selectedCard,values)
        : appContext.buildFbPostText(selectedCard,values);
      copyListingTitleBtn.disabled = !listingTitleOutput.value.trim();
      copyTitleBtn.disabled = !titleInput.value.trim();
      copyPostBtn.disabled = !output.value.trim();
      prepareBtn.disabled = !output.value.trim();
      downloadBtn.disabled = appContext.getImages(selectedCard).length === 0;
    }

    function renderSelectedCard(){
      if(!selectedCard){
        selectedCardMount.hidden = true;
        selectedCardMount.innerHTML = "";
        return;
      }
      const image = appContext.getImages(selectedCard)[0] || "";
      selectedCardMount.hidden = false;
      selectedCardMount.innerHTML = `
        <div class="fb-post-card-image">
          ${image ? `<img src="${appContext.escapeHtml(image)}" alt="${appContext.escapeHtml(selectedCard.name)}">` : `<div class="fb-post-no-image">No image</div>`}
        </div>
        <div class="fb-post-card-copy">
          <strong>${appContext.escapeHtml(selectedCard.name)}</strong>
          <span>${appContext.escapeHtml([
            selectedCard.card_code,
            selectedCard.year,
            selectedCard.game,
            selectedCard.series
          ].filter(Boolean).join(" · "))}</span>
          <small>${appContext.escapeHtml(selectedCard.availability || "Available")} · ${appContext.getImages(selectedCard).length} image${appContext.getImages(selectedCard).length === 1 ? "" : "s"}</small>
          ${nfsMode ? "" : `<small class="fb-post-card-price">Price · ${appContext.escapeHtml(appContext.postGeneratorCardPricePreview(selectedCard))}</small>`}
        </div>
      `;
    }

    function selectCard(cardId){
      selectedCard = appContext.getCardById(cardId) || null;

      if(!selectedCard){
        titleInput.value = "";
        openCardBtn.disabled = true;
        renderSelectedCard();
        updateOutput();
        return;
      }

      const meta = perCardMeta[selectedCard.id] || {};
      const normalDefaultTitle=appContext.defaultFbPostTitle(selectedCard);
      const nfsDefaultTitle=`${appContext.fbGameLabel(selectedCard)} COLLECTION SHOWCASE【NFS】${String(selectedCard.name||"").toUpperCase()}${selectedCard.card_code ? ` · ${String(selectedCard.card_code).toUpperCase()}` : ""}`.trim();
      titleInput.value = String(
        meta.title || (nfsMode ? nfsDefaultTitle : normalDefaultTitle)
      ).slice(0,300);

      hashtagsInput.value = prefs.hashtags === appContext.FB_POST_DEFAULTS.hashtags
        ? appContext.defaultFbHashtags(selectedCard)
        : prefs.hashtags;

      openCardBtn.disabled = false;
      renderSelectedCard();
      updateOutput();
    }

    select.addEventListener("change", ()=>selectCard(select.value));

    [searchInput,gameFilter,statusFilter,typeFilter].forEach(input=>{
      input.addEventListener("input",renderFbSingleCardOptions);
      input.addEventListener("change",renderFbSingleCardOptions);
    });

    renderFbSingleCardOptions();

    openCardBtn.addEventListener("click",()=>{
      if(!selectedCard || openCardBtn.disabled) return;
      // Show the existing card-details overlay in place. Do not change the
      // route, so closing the details returns to this generator exactly as-is.
      appContext.openDetailsModal(selectedCard);
    });

    const requestedCardId=appContext.safeCardId(appContext.currentHashParams().get("card"));
    if(requestedCardId && selectableCards.some(card=>String(card.id)===requestedCardId)){
      const requestedCard=appContext.getCardById(requestedCardId);
      if(requestedCard){
        searchInput.value="";
        gameFilter.value="";
        if(!nfsMode) statusFilter.value="";
        typeFilter.value="";
        renderFbSingleCardOptions();
        select.value=requestedCardId;
        selectCard(requestedCardId);
      }
    }

    [titleInput,languageInput,templateModeInput,shopInput,instagramInput,hashtagsInput].filter(Boolean).forEach(input=>{
      input.addEventListener("input", ()=>{
        persistCurrent();
        updateOutput();
      });
      input.addEventListener("change", ()=>{
        persistCurrent();
        updateOutput();
      });
    });

    copyListingTitleBtn.addEventListener("click", ()=>{
      appContext.copyPlainText(listingTitleOutput.value, "Listing title copied");
    });

    copyTitleBtn.addEventListener("click", ()=>{
      appContext.copyPlainText(titleInput.value, "Facebook title copied");
    });

    copyPostBtn.addEventListener("click", ()=>{
      appContext.copyPlainText(output.value, nfsMode ? "NFS showcase post copied" : "Facebook post copied");
    });

    prepareBtn.addEventListener("click", async ()=>{
      if(!selectedCard) return;
      if(!appContext.requireOwner("prepare single-card Facebook post")) return;
      if(!output.value.trim()){
        appContext.showToast("No Facebook post to prepare");
        return;
      }

      const originalText=prepareBtn.textContent;
      prepareBtn.disabled=true;
      copyPostBtn.disabled=true;
      downloadBtn.disabled=true;
      prepareBtn.textContent="Preparing…";

      try{
        const copied=await appContext.copyPlainText(
          output.value,
          nfsMode ? "NFS showcase post copied" : "Facebook post copied"
        );
        if(!copied) throw new Error("Could not copy Facebook post");

        const images=appContext.getImages(selectedCard);
        if(!images.length){
          appContext.showToast("Post copied · no card images to download");
          return;
        }

        prepareBtn.textContent="Creating image ZIP…";
        const result=await appContext.downloadSingleCardImagesZip(
          selectedCard,
          (done,total,added,failed)=>{
            prepareBtn.textContent=failed
              ? `ZIP ${done}/${total} · ${failed} skipped`
              : `ZIP ${done}/${total}`;
          }
        );

        appContext.showToast(
          result.failed.length
            ? `Post ready · ${result.added} images included · ${result.failed.length} skipped`
            : `Post ready · text copied + ${result.added} image${result.added===1?"":"s"} ZIP`
        );
      }catch(err){
        console.error("Prepare single-card Facebook post error:",err);
        appContext.showToast(`Could not fully prepare post${err?.message ? `: ${String(err.message).slice(0,100)}` : ""}`);
      }finally{
        prepareBtn.textContent=originalText;
        updateOutput();
      }
    });

    downloadBtn.addEventListener("click", async ()=>{
      if(!selectedCard) return;
      if(!appContext.requireOwner("download single-card image ZIP")) return;

      const images = appContext.getImages(selectedCard);
      if(!images.length){
        appContext.showToast("No card images available");
        return;
      }

      const originalText = downloadBtn.textContent;
      downloadBtn.disabled = true;
      downloadBtn.textContent = "Preparing ZIP…";

      try{
        const result = await appContext.downloadSingleCardImagesZip(
          selectedCard,
          (done,total,added,failed)=>{
            downloadBtn.textContent = failed
              ? `Preparing ${done}/${total} · ${failed} skipped`
              : `Preparing ${done}/${total}`;
          }
        );

        appContext.showToast(
          result.failed.length
            ? `ZIP downloaded · ${result.added} included · ${result.failed.length} skipped`
            : `ZIP downloaded with ${result.added} image${result.added===1?"":"s"}`
        );
      }catch(err){
        console.error("Single-card ZIP error:", err);
        appContext.showToast(`Could not create image ZIP${err?.message ? `: ${String(err.message).slice(0,100)}` : ""}`);
      }finally{
        downloadBtn.disabled = false;
        downloadBtn.textContent = originalText;
      }
    });
  }

  Object.assign(appContext,{postGeneratorCardPricePreview,compactGeneratedPostSpacing,normalizePostHashtags,normalizePostLanguage,getPostGeneratorLanguage,savePostGeneratorLanguage,postLanguageSelectHTML,postLocale,replacePostTokens,postSalesFooterLines,facebookGroupSalesCopy,facebookGroupSalesFooterLines,getFbPostPrefs,saveFbPostPrefs,getFbCardMeta,saveFbCardMeta,safeHttpUrl,openSafeExternalUrl,fbFormatLabel,postEraLabel,postPopLabel,fbGameLabel,defaultFbPostTitle,singleCardCopyTitle,defaultFbHashtags,buildFbPostText,buildFbNfsPostText,copyTextToClipboard,copyPlainText,currentFacebookToolMode,facebookToolsHeaderHTML,renderFacebookToolsPage,renderFbPostGeneratorPage});
  registerGiveawayPosts(appContext);
  registerMarketplacePosts(appContext);
  registerCardListPosts(appContext);
}

/** State and event initialization; called in preserved startup order. */
export function initialize(appContext,runtime){
  appContext.POST_GENERATOR_LANGUAGE_KEY = "collect_tcg_post_generator_language_v1";
  appContext.FB_GIVEAWAY_POST_PREFS_KEY = "collect_tcg_fb_giveaway_post_prefs_v1";

  appContext.FB_GIVEAWAY_POST_DEFAULTS = Object.freeze({
    giveawayNumber:"3",
    winnerHeadline:"WIN PSA10 ONE PIECE CARD!",
    prizeLine:'[PSA10] LECAFIG GOLD TEXT LEADER "JEWELRY BONNEY" SHONEN JUMP',
    facebookPageUrl:"https://www.facebook.com/profile.php?id=61590041416102",
    instagramUrl:"https://www.instagram.com/collecttcg.mysg/",
    facebookGroupUrl:"https://www.facebook.com/groups/1765445114770379",
    includeFacebookGroupBonus:true,
    commentText:"That’s him officer!!! 🫵👮",
    claimHours:"24",
    winnerTool:"Wheel of Names",
    giveawayEnds:"23 August at 10:00 PM GMT+8 (Sunday)",
    cod:"KL — TRX / KLCC / Pavilion KL",
    postage:"Available",
    carousellMalaysiaUrl:"https://sl1nk.com/nezhxv2",
    carousellSingaporeUrl:"https://l1nq.com/i7eq8mx",
    hashtags:"#tcg #onepiece #onepiecetcg #onepiecetradingcardgame #tcgcommunity #tcgcollector",
    includeMultiGroupNotice:true
  });

  appContext.CAROUSELL_POST_PREFS_KEY = "collect_tcg_carousell_post_prefs_v1";

  appContext.FB_CARD_LIST_POST_PREFS_KEY = "collect_tcg_fb_card_list_post_prefs_v1";

  appContext.jsZipLoadPromise = null;
}
