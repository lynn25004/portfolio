const symptoms = {
  "面對家人": {
    category: "診療方向｜家與未竟之語",
    color: "#6f4f46",
    summary: "你不是不愛家，只是「家」這個字同時牽動依戀、委屈、責任與逃離。",
  },
  "二十一世紀適應困難症": {
    category: "診療方向｜潮濕日常",
    color: "#735f3c",
    summary: "你不是單純心情不好，而是被日常、訊息、責任和焦慮一起浸得太久。",
  },
  "病後重建": {
    category: "診療方向｜病後重建",
    color: "#5d617a",
    summary: "你正在學習和一個再也回不到原狀的世界相處，微光變得很小，卻仍然沒有熄滅。",
  },
  "太過嚴肅": {
    category: "診療方向｜答案過載",
    color: "#7a4a36",
    summary: "你把每件事都看得太重，連休息都像一項必須完成得很好的任務。",
  },
  "世界開始變無聊了": {
    category: "診療方向｜感官失焦",
    color: "#8a7443",
    summary: "你不是沒有生活，只是太久沒有真正看見生活。世界還在發光，只是你的感官暫時失焦。",
  },
  "慣性疏離": {
    category: "診療方向｜玻璃般的距離",
    color: "#52664f",
    summary: "你把距離維持得剛剛好，像住在透明玻璃後面，看得見世界，卻很少讓世界碰到你。",
  },
  "初老症": {
    category: "診療方向｜年歲轉場",
    color: "#697064",
    summary: "你不是害怕變老，而是還沒習慣用新的身體、新的節奏，重新認領自己。",
  },
  "愛與愛碰撞之後是痛": {
    category: "診療方向｜愛裡的警報",
    color: "#7b4a5b",
    summary: "你渴望愛成為避難所，卻也太清楚：越想靠近，越可能暴露自己害怕失去的地方。",
  },
  "肌膚缺渴": {
    category: "診療方向｜確認的飢渴",
    color: "#8b5550",
    summary: "你要的也許不是更多愛，而是有人能看見你心裡那個一直被忽略的缺口。",
  },
  "親密關係練習": {
    category: "診療方向｜親密練習",
    color: "#84684c",
    summary: "你不是不懂愛，只是這個時代太急，急到你忘了親密原本需要慢慢靠近。",
  },
  "與失去共度餘生": {
    category: "診療方向｜與缺席同行",
    color: "#625f86",
    summary: "你沒有停在過去，你只是仍在練習帶著缺席生活，讓告別慢慢有地方安放。",
  },
  "害怕長大": {
    category: "診療方向｜成長未完成",
    color: "#375465",
    summary: "你不是拒絕成為大人，而是不知道該成為哪一種大人，才不會弄丟自己。",
  },
  "尚未命名的霧": {
    category: "診療方向｜混合心緒",
    color: "#5e655e",
    summary:
      "你的答案沒有明顯落在單一處方，而是像幾種情緒同時在展場裡回聲。這不是不準，而是此刻的你還不適合被一個症狀匆忙命名。",
  },
};

const questions = [
  {
    "prompt": "你走進一間存放舊日記憶的房間。哪一處最容易讓你感到不舒服？",
    "choices": [
      [
        "餐桌旁傳來熟悉的說話聲。我明明想走近，身體卻先一步停下，彷彿那些沒有說完的家庭往事仍在原地等我。",
        "面對家人",
        "這句話指向家人之間難以整理的牽連：想靠近，也會本能地防備。"
      ],
      [
        "窗外已經慢慢天亮，房間卻像仍停在昨夜。我習慣獨自留在黑暗，任由時間從身旁經過。",
        "慣性疏離",
        "這句話靠近長期獨處後形成的距離感：不是等待誰，而是習慣不被打擾。"
      ],
      [
        "桌上擺著花、杯子和一些不起眼的小東西。我知道它們就在眼前，卻已經很久沒有真正注意過它們。",
        "世界開始變無聊了",
        "這句話在看生活感受力是否變鈍：東西還在，心卻很久沒有停下來看。"
      ],
      [
        "門上掛著「下一階段」的牌子，所有人都催我進去。我卻不知道跨過門後，自己究竟應該成為什麼人。",
        "害怕長大",
        "這句話指向人生轉場前的不確定：不是不前進，而是不知道要成為誰。"
      ]
    ]
  },
  {
    "prompt": "最近的生活，最像被哪一種東西慢慢塞滿？",
    "choices": [
      [
        "許多說大不大、說小不小的煩惱。每件事似乎都能處理，全部堆在一起時，卻讓我突然煩躁或疲憊。",
        "二十一世紀適應困難症",
        "這句話測的是被日常碎片長期消耗：沒有單一巨響，卻一直潮濕。"
      ],
      [
        "一場變故留下的痕跡。身體或日常已經和以前不同，我卻還不知道該怎麼帶著現在的自己繼續生活。",
        "病後重建",
        "這句話靠近重大變故後的重新適應：世界沒有停下，你卻需要重新學會生活。"
      ],
      [
        "鏡子裡逐漸增加的改變。體力、外貌或身體節奏稍有不同，我就擔心自己正在失去年輕與選擇的權利。",
        "初老症",
        "這句話指向年歲帶來的不安：不是單純怕老，而是怕自己被生活推到旁邊。"
      ],
      [
        "一整疊標準答案。我總覺得每個決定都會影響一生，彷彿只要走錯一步，人生就會偏離軌道。",
        "太過嚴肅",
        "這句話在測你是否把人生看得過度關鍵：每一步都像考題，每件事都不能錯。"
      ]
    ]
  },
  {
    "prompt": "關於親密關係，哪一種狀態最令你疲憊？",
    "choices": [
      [
        "愛人曾讓未來變得清晰；可是當愛開始動搖，連原本相信的方向也一起失去了焦距。",
        "愛與愛碰撞之後是痛",
        "這句話靠近愛裡的不安全感：當關係晃動，連自己也跟著失焦。"
      ],
      [
        "即使有人靠近、擁抱或需要我，心裡仍然沒有真正充實；我總需要更多接觸，才能確認自己值得被愛。",
        "肌膚缺渴",
        "這句話測的是被看見與被需要的飢渴：越靠近，越怕空洞沒有被填滿。"
      ],
      [
        "我受夠還沒真正認識一個人，就被配對、秒回和關係標籤推著往前。心動發生得太快，理解總是來不及。",
        "親密關係練習",
        "這句話指向對慢速親密的渴望：想把愛從即時反應裡帶回真實相處。"
      ],
      [
        "摯愛離世以後，我仍習慣在心裡和他說話。那些未完成的告別，至今找不到可以安放的位置。",
        "與失去共度餘生",
        "這句話清楚指向死亡之後仍未完成的關係：思念還在，告別還沒有位置。"
      ]
    ]
  },
  {
    "prompt": "當你回頭看自己的成長，哪一段最像尚未處理完的傷口？",
    "choices": [
      [
        "童年的反抗、委屈與依戀混在一起。即使已經長大，一談到家，我仍會同時感到想靠近與想逃開。",
        "面對家人",
        "這句話測的是原生家庭裡的矛盾情感：愛、委屈和防備同時存在。"
      ],
      [
        "生活裡累積了太多細小的不安。它們不至於讓我立刻崩潰，卻長期消耗著我的耐性和情緒。",
        "二十一世紀適應困難症",
        "這句話靠近日常型疲憊：不是一刀切開，而是被很多小事慢慢磨薄。"
      ],
      [
        "我總是在事情過去很久以後，才發現自己當時正在告別；等到想把話說完，那個人已經無法回答。",
        "與失去共度餘生",
        "這句話指向死亡或永久離別後的遲來痛感：想說話時，對方已不能回應。"
      ],
      [
        "我跨出學校，又立刻進入另一套規則。世界急著替我安排位置，我卻還沒弄清楚長大究竟是什麼。",
        "害怕長大",
        "這句話在測面對制度與人生階段的卡關：已經被推上路，心裡卻還沒準備好。"
      ]
    ]
  },
  {
    "prompt": "如果生活突然出現一道裂縫，你最可能從裡面看見什麼？",
    "choices": [
      [
        "一排又一排的刻度與進度表。我一直用過度嚴格的方式，檢查自己有沒有成為一個「正確的人」。",
        "太過嚴肅",
        "這句話測的是自我審核過重：你太常用量尺檢查自己值不值得。"
      ],
      [
        "許多曾經喜歡的小事都失去了顏色。我每天經過同樣的街道，回想起來卻只剩下「今天沒什麼特別」。",
        "世界開始變無聊了",
        "這句話靠近感官疲乏：生活沒有消失，只是你暫時看不見它的細節。"
      ],
      [
        "鏡子裡的模樣與身體節奏正在改變。我知道時間本來就會往前，心裡卻仍抗拒現在的自己。",
        "初老症",
        "這句話指向與年歲變化的摩擦：明知道會變，卻還不知如何接住現在的自己。"
      ],
      [
        "裂縫裡放著變故發生以前的生活。我知道無法回到原樣，卻還沒有學會如何與現在的限制相處。",
        "病後重建",
        "這句話測的是變故後的重建期：你不是只在懷念從前，也正在學習新的邊界。"
      ]
    ]
  },
  {
    "prompt": "展櫃裡有四封沒有署名的信。哪一封最像你曾經想寫出的？",
    "choices": [
      [
        "「你一沉默，我就開始害怕失去。」",
        "愛與愛碰撞之後是痛",
        "這封信指向關係裡被沉默觸發的不安：愛一安靜，你就開始預演失去。"
      ],
      [
        "「我好像只有在被注視、被渴望或被需要時，才能感覺自己存在。」",
        "肌膚缺渴",
        "這封信測的是靠外界確認維持存在感：被看見才安心，安靜時就空下去。"
      ],
      [
        "「我厭倦了用回覆速度衡量感情，也厭倦還沒理解彼此，就急著決定關係。我不知道愛為什麼總在趕時間。」",
        "親密關係練習",
        "這封信指向慢速相處的需求：想把感情從秒回與標籤裡救回來。"
      ],
      [
        "「我已經很習慣獨自消化生活。房間、夜色與漫長的清晨，替我收留那些無法說明的感受。」",
        "慣性疏離",
        "這封信靠近習慣性自我收納：不是沒有感受，而是不常把感受交給別人。"
      ]
    ]
  },
  {
    "prompt": "哪一種不舒服，最近最常在生活裡反覆發作？",
    "choices": [
      [
        "只要和家人相處，我就容易回到過去的情緒裡、說出口的話卻總是變得生硬。",
        "面對家人",
        "這句話測的是家庭關係裡的舊反應：人已長大，情緒仍被帶回原地。"
      ],
      [
        "我很難允許事情沒有意義、問題沒有答案。",
        "太過嚴肅",
        "這句話指向對答案的執著：空白會讓你焦躁，無意義會讓你不安。"
      ],
      [
        "我知道關係裡不可能永遠令人安心，卻還是害怕彼此之間出現任何距離，彷彿每一次疏遠，都是離開的前兆。",
        "愛與愛碰撞之後是痛",
        "這句話靠近依附裡的警報：距離一出現，心就開始準備受傷。"
      ],
      [
        "每當外貌、體力或年齡被提起，我就像被提醒自己正在退場，很難把老去看成正常的人生變化。",
        "初老症",
        "這句話測的是年齡帶來的被取代感：你怕的不只是變老，而是失去主場。"
      ]
    ]
  },
  {
    "prompt": "在最安靜的展廳裡，哪一種沉默最接近你？",
    "choices": [
      [
        "不是某一件大事讓我難受，而是工作、家庭、關係與自我懷疑同時住進日常，讓我不知道該先整理哪一件。",
        "二十一世紀適應困難症",
        "這句話測的是多重壓力同時堆疊：每件都不致命，合起來卻讓人喘不過氣。"
      ],
      [
        "展櫃裡放滿日常物件，我卻很難對其中任何一件產生感覺。生活好像只剩下使用、完成和丟棄。",
        "世界開始變無聊了",
        "這句話指向感受力下降：物件還在，世界卻暫時失去被珍惜的理由。"
      ],
      [
        "房間裡充滿身體、目光與欲望。我不斷尋找靠近，卻也不斷懷疑，別人看見的究竟是我，還是他們需要的樣子。",
        "肌膚缺渴",
        "這句話靠近欲望與自我確認的混雜：被渴望時存在，卻也怕自己被誤認。"
      ],
      [
        "我在相同的規則與任務裡反覆打轉，事情一件件做完了，卻沒有真正前進的感覺。",
        "害怕長大",
        "這句話測的是成長前的停滯感：你有完成任務，卻不確定自己是否真的往前。"
      ]
    ]
  },
  {
    "prompt": "如果今晚只留下一盞燈，它最需要照見哪一個身影？",
    "choices": [
      [
        "那個在疾病、意外或重大變故後，還不習慣現在的身體，也不知道該如何重新走回家庭、朋友與愛情中的人。",
        "病後重建",
        "這盞燈照向變故後的人：他需要的不只是同情，而是重新回到生活裡。"
      ],
      [
        "那個總是獨自醒著的人。他並不是等待誰來敲門，只是早已習慣在光影交替之間，慢慢整理漂流的記憶。",
        "慣性疏離",
        "這盞燈照向長期獨處者：不是渴望被拉走，而是在孤獨裡整理自己。"
      ],
      [
        "那個在訊息裡快速心動、快速確認，又快速失望的人。他已經很久沒有和誰慢慢走路、慢慢談話。",
        "親密關係練習",
        "這盞燈照向被速度推著走的親密：你想要一次真正慢下來的相遇。"
      ],
      [
        "那個在親人離世後仍停留在原地的人。他有太多懺悔、思念與承諾，至今無法交到對方手中。",
        "與失去共度餘生",
        "這盞燈照向死亡之後的未竟之語：有些話，仍在找可以安放的地方。"
      ]
    ]
  },
  {
    "prompt": "有人問你：「最近過得怎麼樣？」哪一個回答最接近真心？",
    "choices": [
      [
        "我想談談家，卻不知道該從愛還是傷害開始。它既是我想回去的地方，也是我最容易產生防備的地方。",
        "面對家人",
        "這句回答靠近家庭的雙重性：家既是歸處，也可能是最先讓你繃緊的地方。"
      ],
      [
        "沒有發生什麼嚴重的事，只是很多細小的不安一直累積。我看起來照常生活，心裡卻長期處於潮濕狀態。",
        "二十一世紀適應困難症",
        "這句回答測的是慢性疲乏：外表正常，內在卻一直沒有真正乾爽。"
      ],
      [
        "我好像一直在等待別人證明我值得被愛。即使得到關注，安心也維持不了多久，很快又需要下一次確認。",
        "肌膚缺渴",
        "這句回答指向確認需求：不是貪心，而是心裡有個很難被一次填滿的空位。"
      ],
      [
        "我把一個人的回覆、沉默與情緒看得太重，焦慮也因此在腦海裡不斷蔓延。",
        "愛與愛碰撞之後是痛",
        "這句回答靠近愛裡的過度警覺：對方一點變化，就足以讓你整夜反覆推演。"
      ]
    ]
  },
  {
    "prompt": "如果生活是一間房，哪一個角落最令你不想整理？",
    "choices": [
      [
        "堆滿小東西的櫃子。它們曾經讓我開心，我卻已經很久沒有仔細看過，甚至想不起當初為什麼珍惜。",
        "世界開始變無聊了",
        "這個角落測的是對日常細節的失聯：曾經發亮的小事，被忙碌蓋住了。"
      ],
      [
        "窗邊那個總是留給自己的位置。天色一次次由暗轉亮，我卻仍習慣讓自己的時間緩慢流動，讓孤獨成為最不需要向誰解釋的生活方式。",
        "慣性疏離",
        "這個角落靠近自成一室的孤獨：你不是想被留下，而是習慣不把自己交出去。"
      ],
      [
        "鏡子前的位置。我害怕看見時間留下的痕跡，也很容易因為外界對年齡的評價，否定現在的自己。",
        "初老症",
        "這個角落測的是與年齡評價的拉扯：你想接受自己，卻常被外界眼光打斷。"
      ],
      [
        "門口那雙幾乎沒走過長路的鞋。現在的約會大多在螢幕裡發生，關係還沒開始理解，就已經被催著決定去留。",
        "親密關係練習",
        "這個角落指向親密的重新練習：先慢慢走，再慢慢理解，不急著命名。"
      ]
    ]
  },
  {
    "prompt": "離開展場前，哪一句話是你目前最難承認的？",
    "choices": [
      [
        "那場變故已經永久改變我的身體與生活，而我仍在懷念那個不需要重新學習一切的自己。",
        "病後重建",
        "這句話測的是重建最痛的部分：承認回不去，也承認自己還在想念從前。"
      ],
      [
        "我之所以如此疲憊，也許不是人生真的處處危險，而是我太習慣把每件事都看成不能出錯的大事。",
        "太過嚴肅",
        "這句話靠近過度緊繃的核心：不是世界全都危險，而是你太少允許自己失誤。"
      ],
      [
        "死亡已經發生，時間也持續向前，但我和那個人的關係仍停在告別尚未完成的那一天。",
        "與失去共度餘生",
        "這句話明確指向死亡後的延續關係：時間往前，心卻仍停在沒說完的那天。"
      ],
      [
        "我不知道自己要成為什麼樣的大人。別人看起來都在前進，我卻像卡在蛻變以前，回不去也過不去。",
        "害怕長大",
        "這句話測的是成為大人前的停滯：不是拒絕長大，而是不知道怎麼長成自己。"
      ]
    ]
  }
];

const reasonCopy = {
  "面對家人": "你的答案靠近飯桌、家門、原生家庭與不容易說出口的委屈。你不是不願意面對家人，而是那裡同時放著愛、責任、失望與童年的舊傷。你需要的不是立刻和解，而是先允許自己承認：複雜也是真實的情感。",
  "二十一世紀適應困難症": "你的選擇多次指向日常性倦怠、訊息過載與現代生活的潮濕感。你看起來還能運轉，卻已經被太多小事磨薄。這不是單一事件造成的崩潰，而是長期生活在過量刺激裡，心裡暫時失去乾爽的能力。",
  "病後重建": "你的答案碰到重大變故、身體創傷、生活脫軌與微光。你並不是沉溺痛苦，而是在學習一種新的日常：某些事情發生後，人不會立刻恢復原狀，只能慢慢找回和世界共處的方法。",
  "太過嚴肅": "你的選擇反覆靠近標準、答案、責任和過度正經的疲憊。你太習慣替人生找意義，於是連休息、犯錯、開玩笑都被你拿來評分。這個結果提醒你：有些時候，鬆動比解答更重要。",
  "世界開始變無聊了": "你的答案指向感受力下降、日常失焦與被重複行程磨鈍的心。你不是沒有生活，而是太久沒有真正看見生活。當每一天都只剩待辦事項，小物、路景、氣味和天空就會逐漸從你的注意力裡退場。",
  "慣性疏離": "你的選擇靠近玻璃、退場、禮貌和把傷痛藏進瑣事裡的習慣。你不是沒有感情，而是太懂得自我保護。你把距離維持得很漂亮，卻也因此常常讓真正需要被看見的部分留在外面。",
  "初老症": "你的答案觸及身體變化、年紀焦慮與重新認領自己的不安。你不是害怕年齡本身，而是忽然發現身體、眼光、社會稱呼和自我想像都在改變。你需要的不是假裝年輕，而是學會用新的節奏活得坦然。",
  "愛與愛碰撞之後是痛": "你的答案靠近愛裡的不安、害怕失去與越靠近越受傷的矛盾。你不是不會愛，而是太知道愛可能讓人暴露。你想被接住，也害怕一旦交出自己，就會再次摔落。",
  "肌膚缺渴": "你的選擇多次碰到被看見、被確認、被留下的渴望。你要的並不只是更多愛或更多回應，而是一種能讓內在安定下來的承認。這個結果指向更深的匱乏：真正需要填補的，可能是你與自己的關係。",
  "親密關係練習": "你的答案靠近親密練習、散步、等待與不被螢幕牽動的愛。你厭倦速食愛情，不是因為你老派，而是你仍相信理解需要時間。你想要的不是更快確認關係，而是更完整地在一個人面前停留。",
  "與失去共度餘生": "你的選擇碰到告別、來不及說完的話、缺席與時間失速。你不是回不去，而是正在學習如何把失去帶進往後的生活。哀悼不是一次結束的事件，而是一種需要被慢慢安放的餘生。",
  "害怕長大": "你的答案靠近人生轉折、成人焦慮與不知道該成為誰的迷惘。你並非拒絕長大，而是害怕長大變成一種被迫格式化。你想成為大人，但不想失去提問、敏感與仍然相信某些事的自己。",
};

Object.assign(symptoms["面對家人"], {
  summary:
    "你不是不愛家，而是家這個字太深了；它同時牽動依戀、責任、委屈，以及那個曾經很想被好好接住的小孩。",
});
Object.assign(symptoms["二十一世紀適應困難症"], {
  summary:
    "你不是單純心情不好，而是被日常、訊息、責任與焦慮浸得太久；表面仍在運轉，心裡卻需要一處乾燥的角落。",
});
Object.assign(symptoms["病後重建"], {
  summary:
    "你正在學習和一個再也回不到原狀的世界相處；那些微光很小，卻替你證明，破裂之後仍然可以慢慢長出新的走法。",
});
Object.assign(symptoms["太過嚴肅"], {
  summary:
    "你把每件事都看得太重，彷彿人生必須時時有解；可你真正需要的，或許是一段不必有用、也不必正確的空白。",
});
Object.assign(symptoms["世界開始變無聊了"], {
  summary:
    "你不是對世界失去興趣，只是太久沒有被世界輕輕碰到；小物、氣味、街角和天空，都還在等你重新抬頭。",
});
Object.assign(symptoms["慣性疏離"], {
  summary:
    "你把距離維持得很漂亮，像站在透明玻璃後看世界；那不是冷淡，而是一種曾經受傷的人，替自己留下的安全感。",
});
Object.assign(symptoms["初老症"], {
  summary:
    "你不是害怕老去，而是在練習用新的身體、新的速度、新的眼光重新認領自己；歲月不是退場，也可以是轉身。",
});
Object.assign(symptoms["愛與愛碰撞之後是痛"], {
  summary:
    "你渴望愛成為避難所，卻也太清楚靠近會使人暴露；所以你一邊想被擁抱，一邊害怕自己又在愛裡摔疼。",
});
Object.assign(symptoms["肌膚缺渴"], {
  summary:
    "你想要的不是更多熱烈，而是一種穩定的被看見；彷彿只要有人真的留下，你心裡那個長久漏風的地方就能安靜一點。",
});
Object.assign(symptoms["親密關係練習"], {
  summary:
    "你不是不懂愛，而是不想再把親密交給速度決定；你仍相信散步、等待、凝視與好好道別，能讓愛重新有重量。",
});
Object.assign(symptoms["與失去共度餘生"], {
  summary:
    "你沒有停在過去，只是仍在學習帶著缺席生活；有些告別不會結束，只會慢慢變成你往後走路的方式。",
});
Object.assign(symptoms["害怕長大"], {
  summary:
    "你不是拒絕成為大人，而是害怕長大以後，再也沒有人替敏感、提問與仍然相信某些事的自己保留位置。",
});
Object.assign(symptoms["尚未命名的霧"], {
  summary:
    "你的答案像散落在不同展室裡的燈，沒有明顯落在單一症狀。這不是測驗失效，而是此刻的心緒還在流動，暫時不適合被太重的名字定型。",
});

Object.assign(reasonCopy, {
  "面對家人":
    "你的選擇多次停在飯桌、家門、原生家庭與不容易說出口的話旁邊。這表示你對家的感受不是單一的愛或怨，而是一整片長年蓄熱的地層。你也許很懂事，很會替家人找理由，卻偶爾仍會在某個語氣、某次關心、某個節日裡，突然想起自己其實也曾經很委屈。這張處方不是催你和解，而是先替你承認：複雜地愛著，也是愛的一種形式。",
  "二十一世紀適應困難症":
    "你的答案反覆靠近日常耗損、訊息過量與說不上來的倦怠。你看起來還能工作、回訊息、安排明天，甚至能把生活維持得很像正常；但心裡某個地方其實已經潮濕太久。這不是你太脆弱，而是這個時代太擅長把人切成很多小份，再要求每一份都即時回應。這張處方想提醒你：累不是失敗，有時只是心正在要求被晾乾。",
  "病後重建":
    "你的選擇靠近變故、身體、復健與生活被迫改寫後的陌生感。你不是停在痛裡，而是正在重新學習如何和痛共處。世界常把復原說得太簡單，好像只要時間過去，人就能回到原本的位置；可是你知道，有些事發生後，原本的位置已經不在了。這張處方看見的，是你還願意在新的地圖上，慢慢找路的勇氣。",
  "太過嚴肅":
    "你的答案一直走向標準、意義、責任與不能出錯的壓力。你像是把人生捧成一本必須批改完成的作業簿，連休息都想休息得有效率。你並不是無趣，而是太常被迫成熟、太早學會承擔，於是忘記了荒謬、玩笑和沒有目的的空白也能救人。這張處方想替你鬆開一點眉頭：不是每件事都需要答案，有時你只需要先活得輕一點。",
  "世界開始變無聊了":
    "你的選擇指向感受力暫時失焦。你不是沒有生活，而是生活太常被功能化：吃飯是補給、走路是移動、休息是恢復戰力，連天空都被你匆匆略過。可你的心並沒有壞掉，它只是太久沒有被小事邀請。這張處方想把你的目光還給世界：一朵花、一張傳單、一盞路燈，都可能重新替今天添上一點名字。",
  "慣性疏離":
    "你的答案靠近退場、玻璃、禮貌與把求救說得很輕的習慣。你不是不需要人，而是太早學會不要麻煩別人；你不是沒有感情，而是太懂得把感情收在剛好不會外露的位置。這種距離保護了你，也讓你偶爾感到孤單得很乾淨。這張處方想溫柔地問你：有沒有一個人、一段文字、一盞燈，是可以被你慢慢放進來的？",
  "初老症":
    "你的答案碰到年歲、身體變化與重新認領自己的不安。你可能把老去說成玩笑，卻在某些瞬間真的感到慌張：體力不如從前、恢復變慢、被世界換上新的稱呼。你害怕的不是年紀本身，而是青春退潮後，自己是否仍然值得被喜歡。這張處方想把老去從損耗裡救出來：你不是正在失去自己，而是在換一種更知道取捨的方式活著。",
  "愛與愛碰撞之後是痛":
    "你的選擇停在親密裡的警報聲旁。你想愛，也真的有能力愛；只是你太清楚，靠近一個人就意味著把脆弱交出去。於是你一邊渴望被接住，一邊預先想像失去；一邊相信擁抱，一邊準備後退。這張處方不是叫你別怕，而是替你承認：會害怕，正是因為你曾經很認真地把心交出去。",
  "肌膚缺渴":
    "你的答案多次靠近被看見、被留下、被確認的需求。你也許常常懷疑自己是不是太黏、太敏感、太需要回應；但真正的核心不一定是戀愛，而是某個長久沒有被穩定承認的自己。你渴望的不是一時熱烈，而是一種能讓內在不再漏風的在場。這張處方想讓你知道：需要被愛並不可恥，重要的是慢慢學會把自己也放回愛裡。",
  "親密關係練習":
    "你的答案靠近親密練習、散步、等待與真正看著彼此的願望。你並不是古板，而是厭倦了把愛情交給通知、秒回、曖昧規則與快速命名。你想要的親密有溫度、有路程、有沉默裡仍能並肩的安心。這張處方替你保存一種老派但珍貴的相信：愛不是越快越真，有些心動需要走很長的路，才會慢慢抵達。",
  "與失去共度餘生":
    "你的選擇停在告別、空位、來不及說完的話與時間被切開的地方。你不是不肯往前，而是失去之後，往前本身就變成一件需要重新學習的事。有些人離開後，世界不會立刻變安靜，反而會在某些平常日子突然回聲很大。這張處方想陪你把那些回聲安放好：不必急著遺忘，記得也是繼續愛的一種方式。",
  "害怕長大":
    "你的答案靠近人生轉場、成人焦慮與不知道該成為誰的迷惘。你不是拒絕長大，而是害怕長大變成一種被迫格式化：變得太懂事、太像別人期待的樣子，最後連自己真正相信什麼都忘了。這張處方讀見的是那個仍想保留提問、敏感與溫柔的你。長大不一定是把自己收起來，也可以是學會替自己留下位置。",
  "尚未命名的霧":
    "你的答案沒有穩定集中在某一帖處方，而是分別靠近幾種不同的情緒：一點疲憊、一點敏感、一點想被理解，也可能有一點還說不清楚的疼。若此時硬把你推向某個強烈症狀，反而會讓處方失真。這張結果想保留那份模糊：有時候，還沒有被命名，也是一種很真實的狀態。",
});

const symptomWhispers = {
  "面對家人": "像是在問：我能不能複雜地愛家",
  "二十一世紀適應困難症": "像是在問：我是不是被日常泡得太濕",
  "病後重建": "像是在問：變故之後我如何繼續",
  "太過嚴肅": "像是在問：我能不能不要凡事都有答案",
  "世界開始變無聊了": "像是在問：我還看得見生活嗎",
  "慣性疏離": "像是在問：我躲得這麼好，誰還找得到我",
  "初老症": "像是在問：我能不能理直氣壯地變老",
  "愛與愛碰撞之後是痛": "像是在問：愛為什麼也會讓人受傷",
  "肌膚缺渴": "像是在問：我為什麼這麼需要被確認",
  "親密關係練習": "像是在問：愛可不可以慢一點",
  "與失去共度餘生": "像是在問：我如何帶著缺席活下去",
  "害怕長大": "像是在問：我會不會長成自己不喜歡的大人",
  "尚未命名的霧": "像是在問：我是不是還不用急著被命名",
};

const deepReadings = {
  "面對家人": {
    inner: "你對家的反應不是單一的愛或恨，而是一整座小火山群。你能理解家人的不完美，也仍記得自己曾經沒有被好好理解的時刻。",
    reaction: "你可能習慣在家人面前保持冷靜，避免把話說得太深；可是某些語氣、飯桌、節日或關心一靠近，你的身體會先緊起來。",
    hidden: "真正卡住你的不是要不要原諒，而是你還沒被允許承認：即使是親密的人，也可能曾經讓你受傷。",
    prescription: "建議閱讀：《小火山群》—楊佳嫻。這帖藥以火為引，適合慢慢照亮原生家庭裡那些委屈、依戀與笨拙的愛。若正處於強烈家庭衝突中，請不要獨自吞服過量悲傷。",
  },
  "二十一世紀適應困難症": {
    inner: "你像是一直開著太多分頁的人，外表仍能回覆、工作、安排生活，內裡卻被細碎情緒佔滿記憶體。",
    reaction: "你可能會突然煩悶、忽然情緒爆炸，或在一切看似正常時感到疲憊。你不是沒有抗壓性，而是壓力已經成為背景音。",
    hidden: "你真正需要的不是更有效率，而是有人承認：活在此刻本身就很耗電。",
    prescription: "建議閱讀：《一千七百種靠近》—蕭詒徽。這是一劑溫和的心理除濕劑，讓那些難以啟齒的委屈與自我懷疑，被別人的文字先替你說出來。",
  },
  "病後重建": {
    inner: "你面對的不是普通低潮，而是生活結構曾經被改寫。疼痛可能不再只是事件，而變成一種你必須學會共處的天氣。",
    reaction: "你會努力維持日常，卻也知道某些齒輪已經不再照舊轉動。你需要時間重新認識身體、關係與未來。",
    hidden: "真正困難的是：世界常催人復原，但你知道復原不是回到原本，而是在破裂後長出新的走法。",
    prescription: "建議閱讀：《不熄燈的房》—徐嘉澤。這帖藥不承諾奇蹟，卻會在黑暗裡替你保留一盞燈，讓你慢慢辨認仍然存在的微光。",
  },
  "太過嚴肅": {
    inner: "你很容易把每件事情都看成生命課題，好像不找出答案就不能安心。你的認真很珍貴，但也可能把你綁得太緊。",
    reaction: "你可能常常過度分析、過度負責，甚至連休息都帶著罪惡感。你不是不會快樂，而是不太敢把無意義的快樂放進生活。",
    hidden: "你真正缺的不是解答，而是一點荒謬感，一點允許自己不必正確的縫隙。",
    prescription: "建議閱讀：《芭樂人生》—吳億偉。這帖藥用無俚頭與荒謬鬆動人生的量尺，適合在工作疲勞、思緒過載、對世界太認真時服用。",
  },
  "世界開始變無聊了": {
    inner: "你並不是對世界失望，而是感受力被重複日常磨鈍了。你仍經過很多事物，只是它們沒有真正進入你心裡。",
    reaction: "你可能把吃飯當補給、走路當移動、休息當恢復戰力。生活被功能化以後，小小的美就很難被你接住。",
    hidden: "你真正需要的不是更大的事件，而是重新訓練自己看見一朵花、一張傳單、一個房間角落裡的光。",
    prescription: "建議閱讀：《小物會》—夏夏。這帖藥適合被行程和重複日常磨鈍的人，服後請在回家路上尋找一件今天第一次真正看見的小物。",
  },
  "慣性疏離": {
    inner: "你不是沒有感覺，而是太會保存自己。你像住在透明水族箱裡，聽得見世界，卻隔著一層無法向別人解釋的玻璃。",
    reaction: "你習慣把傷痛藏進日常，把求救說得很輕，把想靠近的心情轉成禮貌與距離。",
    hidden: "你真正害怕的不是孤單，而是靠近以後再次被誤會、被碰疼，或被要求立刻變好。",
    prescription: "建議閱讀：《白馬走過天亮》—言叔夏。這帖藥像慢慢穿過陰影的微光，讓疏離不再只是逃避，也成為整理感受的方式。",
  },
  "初老症": {
    inner: "你開始意識到身體不是永遠聽話的容器。年齡、恢復速度、稱呼和外貌變化，都在提醒你：時間正在用另一種方式靠近。",
    reaction: "你可能一邊取笑自己老了，一邊真的感到不安。你害怕的不是皺紋本身，而是社會好像只把青春當成有價值的狀態。",
    hidden: "你真正需要的是把年齡從退場改寫成轉場，承認自己不再年輕，卻可以更自由、更通透。",
    prescription: "建議閱讀：《初老，然後呢？》—米果。這帖藥適合搭配『不過度在意他人眼光』服用，練習按自己的節奏，優雅且理直氣壯地老去。",
  },
  "愛與愛碰撞之後是痛": {
    inner: "你在愛裡渴望安全感，卻也最怕安全感消失。愛對你而言既是避難所，也是會讓傷口再次曝光的地方。",
    reaction: "你可能一靠近就開始不安，一感受到距離就想確認。你不是太敏感，而是曾經在關係裡學會了警覺。",
    hidden: "你真正害怕的不是愛，而是愛到最後又只剩自己，還要假裝曾經的投入不算什麼。",
    prescription: "建議閱讀：《我只擔心雨會不會一直下到明天早上》—徐珮芬。這帖藥會把愛裡的依附、焦慮與疼痛攤開，提醒你：愛不是萬能解藥，但曾經愛過的自己仍值得被善待。",
  },
  "肌膚缺渴": {
    inner: "你很需要被看見、被肯定、被確認留下。那不是單純撒嬌，而是內在有一個地方長期缺水。",
    reaction: "你可能會反覆測量別人的回應，從語氣、速度、眼神裡尋找自己是否被重視。越在乎，越容易覺得不夠。",
    hidden: "真正需要填補的，也許不是愛的數量，而是你對自身價值的失落感。",
    prescription: "建議閱讀：《愛情酒店》—陳雪。這帖藥不是填補空洞的解藥，而是一面照見欲望與缺口的鏡子；請先別急著把自己判定為戀愛腦。",
  },
  "親密關係練習": {
    inner: "你厭倦了太快開始、太快確認、太快消失的關係。你其實仍相信親密需要時間，需要散步，需要真正看著彼此。",
    reaction: "你可能不想再用已讀、秒回和曖昧規則測量愛。你想慢慢認識一個人，而不是只在螢幕裡消耗期待。",
    hidden: "你真正渴望的是一種老派的專注：不急著抵達結果，而是在過程裡確認彼此是否真的能同行。",
    prescription: "建議閱讀：《老派約會之必要》—李維菁。這帖藥召回被速度遺忘的浪漫，建議每週練習一次無手機約會，把注意力還給眼前的人。",
  },
  "與失去共度餘生": {
    inner: "你被放在過去的悔遲與未來的空白之間。失去讓時間變形，也讓許多來不及說完的話停在身體裡。",
    reaction: "你可能有時看似平靜，有時又被某個細節突然帶回崩塌現場。這不是退步，而是哀悼本來就不是直線。",
    hidden: "你真正面對的是：如何不是忘記，而是帶著缺失走得更遠。",
    prescription: "建議閱讀：《訣離記》—鍾文音。這帖藥適合透過閱讀或書寫，替來不及完成的告別找到安放之處，讓問號慢慢變成可以走下去的路。",
  },
  "害怕長大": {
    inner: "你站在人生轉折處，不知道自己要成為什麼樣的大人。世界變大了，答案卻反而變少。",
    reaction: "你可能在升學、畢業、離家、就業或其他制度轉場裡感到卡關。你不是不成熟，而是正在和未完成的自己共存。",
    hidden: "你真正害怕的不是長大，而是長成一個只懂正確、卻不再會提問的人。",
    prescription: "建議閱讀：《新兵生活教練》—吳佳駿。這帖藥適合正在轉場的人，提醒你成長不是變完美，而是不斷修補、推翻，仍保留思辨的勇氣。",
  },
  "尚未命名的霧": {
    inner:
      "你此刻的心緒不是一條直線，而像幾條展場動線交會在同一個轉角。你可能同時感到疲倦、敏感、想靠近、想逃開，卻還沒有一種感受大聲到足以代表全部的你。",
    reaction:
      "你可能會在不同答案之間擺盪：有時想被理解，有時想安靜，有時覺得生活很重，有時又只是需要一點溫柔。這種不穩定不是矛盾，而是心正在找比較準確的語言。",
    hidden:
      "真正卡住你的，也許不是某一個明確症狀，而是你還沒有時間把最近發生的事情整理成自己的話。你不必急著把自己交給一個標籤，先承認「我還在霧裡」就夠了。",
    prescription:
      "建議先從短篇散文或詩開始閱讀。此刻不必急著服用強烈處方，可以先選一本能陪你慢慢安靜下來的台灣文學作品，讓文字替你把霧照淡一點。",
  },
};

const state = {
  current: 0,
  answers: Array(questions.length).fill(null),
  currentSymptom: null,
};

const fallbackSymptom = "尚未命名的霧";
const strongPrescriptionSymptoms = new Set(["病後重建"]);
const resultOrder = [
  "二十一世紀適應困難症",
  "世界開始變無聊了",
  "太過嚴肅",
  "慣性疏離",
  "害怕長大",
  "面對家人",
  "初老症",
  "親密關係練習",
  "肌膚缺渴",
  "愛與愛碰撞之後是痛",
  "與失去共度餘生",
  "病後重建",
];

function validateQuizConfiguration() {
  const errors = [];
  const scoredSymptoms = new Set(resultOrder);
  const optionCounts = Object.fromEntries(resultOrder.map((name) => [name, 0]));

  questions.forEach((question, questionIndex) => {
    if (!question.prompt || !Array.isArray(question.choices) || question.choices.length !== 4) {
      errors.push(`第 ${questionIndex + 1} 題格式不完整。`);
      return;
    }

    question.choices.forEach((choice, choiceIndex) => {
      const [label, symptom, whisper] = choice;
      if (!label || !symptom || !whisper) {
        errors.push(`第 ${questionIndex + 1} 題第 ${choiceIndex + 1} 個選項缺少文字、症狀或說明。`);
      }
      if (!scoredSymptoms.has(symptom)) {
        errors.push(`第 ${questionIndex + 1} 題第 ${choiceIndex + 1} 個選項連到未列入計分的結果：${symptom}`);
        return;
      }
      optionCounts[symptom] += 1;
    });
  });

  resultOrder.forEach((symptom) => {
    if (!symptoms[symptom]) errors.push(`缺少結果基本資料：${symptom}`);
    if (!reasonCopy[symptom]) errors.push(`缺少結果原因文案：${symptom}`);
    if (!deepReadings[symptom]) errors.push(`缺少結果深層解析：${symptom}`);
    if (optionCounts[symptom] !== 4) {
      errors.push(`${symptom} 的選項數是 ${optionCounts[symptom]}，應為 4。`);
    }
  });

  if (!symptoms[fallbackSymptom] || !reasonCopy[fallbackSymptom] || !deepReadings[fallbackSymptom]) {
    errors.push(`缺少混合型結果資料：${fallbackSymptom}`);
  }

  if (errors.length) {
    console.error("文學診療室題庫設定有誤：", errors);
  }

  return errors;
}

const progressText = document.querySelector("#progress-text");
const progressBar = document.querySelector("#progress-bar");
const questionTitle = document.querySelector("#question-title");
const selectionStatus = document.querySelector("#selection-status");
const optionGrid = document.querySelector("#option-grid");
const backButton = document.querySelector("#back-button");
const skipButton = document.querySelector("#skip-button");
const nextButton = document.querySelector("#next-button");
const restartButton = document.querySelector("#restart-button");
const soundButton = document.querySelector("#sound-button");
const entryScreen = document.querySelector("#entry-screen");
const enterButton = document.querySelector("#enter-button");
const testCard = document.querySelector(".test-card");
const resultPaper = document.querySelector(".result-paper");
const emailInput = document.querySelector("#result-email");
const emailResultButton = document.querySelector("#email-result-button");
const downloadResultButton = document.querySelector("#download-result-button");
const saveStatus = document.querySelector("#save-status");
const imageDialog = document.querySelector("#result-image-dialog");
const resultImagePreview = document.querySelector("#result-image-preview");
const saveImageButton = document.querySelector("#save-image-button");
const shareImageButton = document.querySelector("#share-image-button");
const openImageLink = document.querySelector("#open-image-link");
const imageDialogCloseButtons = document.querySelectorAll("[data-close-image-dialog]");
const EMAILJS_CONFIG = {
  serviceId: "default_service",
  templateId: "template_o4dafbc",
  publicKey: "RK44exi5yeLxrczCL",
};

const bgm = new Audio(
  "https://upload.wikimedia.org/wikipedia/commons/transcoded/7/7b/%E3%80%90%E7%84%A1%E6%96%99%E3%83%95%E3%83%AA%E3%83%BCBGM%E3%80%91%E5%88%87%E3%81%AA%E3%81%84%E3%83%94%E3%82%A2%E3%83%8E%E3%82%BD%E3%83%AD%E3%80%8CPiano_Melancholy%E3%80%8D.opus/%E3%80%90%E7%84%A1%E6%96%99%E3%83%95%E3%83%AA%E3%83%BCBGM%E3%80%91%E5%88%87%E3%81%AA%E3%81%84%E3%83%94%E3%82%A2%E3%83%8E%E3%82%BD%E3%83%AD%E3%80%8CPiano_Melancholy%E3%80%8D.opus.mp3",
);
bgm.autoplay = true;
bgm.loop = true;
bgm.preload = "auto";
bgm.volume = 0.28;
let soundOn = false;
let resultImageDataUrl = "";
let resultImageBlob = null;
let resultImageFilename = "文學診療室-處方.png";
let resultImageObjectUrl = "";

function getScores() {
  const scores = Object.fromEntries(resultOrder.map((name) => [name, 0]));
  state.answers.forEach((symptom) => {
    if (symptom) scores[symptom] += 1;
  });
  return scores;
}

function getTopSymptom() {
  const sortedScores = getSortedScores();
  const topScore = sortedScores[0][1];
  const tiedTop = sortedScores.filter(([, score]) => score === topScore);

  if (topScore < 2 && tiedTop.length > 1) return fallbackSymptom;

  const topSymptom = sortedScores[0][0];
  if (strongPrescriptionSymptoms.has(topSymptom) && topScore < 2) return fallbackSymptom;

  if (strongPrescriptionSymptoms.has(topSymptom) && topScore < 3 && tiedTop.length > 1) {
    const softerTop = tiedTop.find(([name]) => !strongPrescriptionSymptoms.has(name));
    if (softerTop) return softerTop[0];
  }

  return topSymptom;
}

function getSortedScores() {
  const scores = getScores();
  return Object.entries(scores)
    .filter(([name]) => name !== fallbackSymptom)
    .sort((a, b) => {
    const scoreDiff = b[1] - a[1];
    if (scoreDiff !== 0) return scoreDiff;
    return resultOrder.indexOf(a[0]) - resultOrder.indexOf(b[0]);
  });
}

function getAnswerClues(symptom) {
  return state.answers
    .map((answer, index) => {
      if (answer !== symptom) return null;
      const selected = questions[index].choices.find(([, choiceSymptom]) => choiceSymptom === answer);
      return selected ? selected[0] : null;
    })
    .filter(Boolean)
    .slice(0, 4);
}

function getMixedAnswerClues() {
  return state.answers
    .map((answer, index) => {
      if (!answer) return null;
      const selected = questions[index].choices.find(([, choiceSymptom]) => choiceSymptom === answer);
      return selected ? selected[0] : null;
    })
    .filter(Boolean)
    .slice(-4);
}

function buildReasonText(symptom, sortedScores) {
  if (symptom === fallbackSymptom) {
    const visibleScores = sortedScores
      .filter(([, score]) => score > 0)
      .slice(0, 4)
      .map(([name]) => `「${name}」`)
      .join("、");
    return [
      "這次沒有任何單一處方累積到足夠明確的重量，所以我沒有把你硬推向某一個強烈症狀。",
      visibleScores
        ? `你的答案比較像在 ${visibleScores} 之間來回停留；它們都曾亮起，但沒有一盞燈足以代表全部。`
        : "你的答案很安靜，像還沒有完全成形的霧。",
      reasonCopy[symptom],
    ].join("\n\n");
  }

  const topScore = sortedScores[0][1];
  const secondScore = sortedScores[1][1];
  const base =
    `這不是分數對你的裁定，而是一段閱讀動線留下的痕跡。` +
    `在十二次選擇裡，你的目光有 ${topScore} 次回到「${symptom}」附近；` +
    `像在展場裡反覆被同一盞燈照見，表示這張處方此刻最能替你收住那些還沒說出口的部分。` +
    `下方列出的問診線索，就是實際導向這張處方的選項。`;
  const tieNote =
    topScore === secondScore
      ? "它也幾乎和另一種情緒並列，像兩張展品在同一面牆上彼此回聲。這表示你此刻不是單一症狀，而是幾種感受同時在心裡說話。"
      : "";
  return `${base}${tieNote}\n\n${reasonCopy[symptom]}`;
}

function getResultDetails() {
  if (!state.currentSymptom) return null;
  const symptom = state.currentSymptom;
  const sortedScores = getSortedScores();
  const second = sortedScores[1] || ["-", 0];
  const isFallback = symptom === fallbackSymptom;
  const confidence = getConfidenceLabel(symptom, sortedScores);
  return {
    symptom,
    category: symptoms[symptom].category,
    summary: symptoms[symptom].summary,
    reason: buildReasonText(symptom, sortedScores),
    deep: deepReadings[symptom],
    primary: isFallback ? "混合心緒｜未明顯集中" : `${symptom}｜${sortedScores[0][1]} 題`,
    secondary: isFallback ? `${sortedScores[0][0]}｜曾短暫靠近` : `${second[0]}｜${second[1]} 題`,
    confidence,
    clues: isFallback ? getMixedAnswerClues() : getAnswerClues(symptom),
    scores: sortedScores,
  };
}

function getConfidenceLabel(symptom, sortedScores) {
  if (symptom === fallbackSymptom) return "分散保留";

  const topScore = sortedScores[0][1];
  const secondScore = sortedScores[1]?.[1] || 0;
  if (topScore >= 4) return "高度明確";
  if (topScore >= 3 && topScore > secondScore) return "明確累積";
  if (topScore >= 2) return "低度明確";
  return "不足命名";
}

function buildResultEmailBody(details) {
  const topDirections = details.scores
    .filter(([, score]) => score > 0)
    .slice(0, 3)
    .map(([name, score]) => `- ${name}：在你的答案裡亮起 ${score} 次`)
    .join("\n");
  const clueLines = details.clues.length
    ? details.clues.map((clue) => `- ${clue}`).join("\n")
    : "- 這次的答案很安靜，沒有留下明顯線索。";
  const deepLines = details.deep
    ? [
        `內在天氣\n${details.deep.inner}`,
        `保護方式\n${details.deep.reaction}`,
        `真正卡住的地方\n${details.deep.hidden}`,
      ].join("\n\n")
    : "";
  return [
    "你好：",
    "",
    "這封信替你收好剛才在「文學診療室」裡留下的答案。",
    "那些被你選中的句子，不一定完整解釋了你，卻像展場裡一盞一盞亮起的燈，慢慢照出此刻最需要被文字靠近的地方。",
    "",
    `此刻為你開出的閱讀處方｜${details.symptom}`,
    `${details.category}`,
    "",
    details.summary,
    "",
    "為什麼是這張處方",
    details.reason,
    "",
    "這張處方讀見的你",
    deepLines,
    "",
    "建議閱讀",
    details.deep?.prescription || "",
    "",
    "其他也曾靠近你的方向",
    topDirections || "- 這次的答案很安靜，沒有留下太多旁支。",
    "",
    `判讀方式｜${details.confidence}`,
    "",
    "你的問診線索",
    clueLines,
    "",
    "如果之後想再回到這間診療室",
    window.location.href.split("#")[0],
    "",
    "願這封信抵達你時，像一張夾在書頁裡的便箋。",
    "它不催你變好，也不急著替你下結論；只是提醒你，當有些疼痛還不知道如何命名，文字可以先在旁邊坐一會兒。",
    "",
    "文學診療室",
  ].join("\n");
}

function buildEmailTemplateParams(details, email) {
  const scoreSummary = details.scores
    .filter(([, score]) => score > 0)
    .slice(0, 3)
    .map(([name, score]) => `${name}: ${score} 題`)
    .join("\n");
  const answerClues = details.clues.length ? details.clues.join("\n") : "沒有可列出的回答線索";
  const emailIntro =
    "這封信替你收好剛才在「文學診療室」裡留下的答案。那些被你選中的句子，像展場裡一盞一盞亮起的燈，慢慢照出此刻最需要被文字靠近的地方。";
  const emailOutro =
    "願這張處方像一張夾在書頁裡的便箋，不催你變好，也不急著替你下結論；只是提醒你，文字可以陪你慢慢辨認自己。";

  return {
    to_email: email,
    email,
    user_email: email,
    reply_to: email,
    from_name: "文學診療室｜閱讀處方",
    clinic_name: "文學診療室",
    subject: `文學診療室｜你的閱讀處方：${details.symptom}`,
    email_subject: `文學診療室｜你的閱讀處方：${details.symptom}`,
    email_intro: emailIntro,
    email_outro: emailOutro,
    result_name: details.symptom,
    result_symptom: details.symptom,
    result_category: details.category,
    result_summary: details.summary,
    result_reason: details.reason,
    deep_inner: details.deep?.inner || "",
    deep_reaction: details.deep?.reaction || "",
    deep_hidden: details.deep?.hidden || "",
    deep_prescription: details.deep?.prescription || "",
    primary_score: details.primary,
    secondary_score: details.secondary,
    confidence_score: details.confidence,
    answer_clues: answerClues,
    score_summary: scoreSummary,
    quiz_url: window.location.href.split("#")[0],
    message: buildResultEmailBody(details),
  };
}

async function sendEmailWithEmailJS(details, email) {
  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      service_id: EMAILJS_CONFIG.serviceId,
      template_id: EMAILJS_CONFIG.templateId,
      user_id: EMAILJS_CONFIG.publicKey,
      template_params: buildEmailTemplateParams(details, email),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(errorText || "EmailJS 沒有回傳詳細原因。");
    error.status = response.status;
    throw error;
  }
}

function getEmailErrorMessage(error) {
  const detail = String(error?.message || "").trim();

  if (error?.status === 400) {
    return `寄送失敗：EmailJS 模板或 Gmail 服務設定還沒完成。請確認 Template 的收件欄位是 {{to_email}}，且 Gmail Service 已連線。${detail ? `（${detail}）` : ""}`;
  }

  if (error?.status === 401 || error?.status === 403) {
    return `寄送失敗：EmailJS 金鑰或安全設定阻擋了這次寄信。請確認 Public Key、Service ID、Template ID 是否正確。${detail ? `（${detail}）` : ""}`;
  }

  return `寄送失敗：目前無法連到寄信服務，請稍後再試。${detail ? `（${detail}）` : ""}`;
}

function renderQuestion() {
  const question = questions[state.current];
  const currentAnswer = state.answers[state.current];
  const number = state.current + 1;
  testCard.classList.remove("is-changing");
  void testCard.offsetWidth;
  testCard.classList.add("is-changing");
  progressText.textContent = `問診 ${number} / ${questions.length}`;
  progressBar.style.width = `${(number / questions.length) * 100}%`;
  questionTitle.textContent = question.prompt;
  selectionStatus.textContent = currentAnswer
    ? "已收進問診：這一句先暫時替你保管。"
    : "尚未選擇；四句都不像時，可以略過這題。";
  optionGrid.innerHTML = "";

  question.choices.forEach(([label, symptom, whisper], index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";
    button.style.animationDelay = `${index * 45}ms`;
    if (currentAnswer === symptom) button.classList.add("is-selected");
    const letter = String.fromCharCode(65 + index);
    const optionMeaning = normalizeOptionMeaning(whisper || symptomWhispers[symptom]);
    button.innerHTML = `
      <span class="option-line"><b class="option-letter">${letter}</b><span>${label}</span></span>
      <small><b>這句在問：</b>${optionMeaning}</small>
    `;
    button.addEventListener("click", () => {
      state.answers[state.current] = symptom;
      button.classList.add("is-tapped");
      optionGrid.querySelectorAll(".option-button").forEach((option) => {
        option.classList.toggle("is-selected", option === button);
        option.setAttribute("aria-pressed", String(option === button));
      });
      selectionStatus.textContent = "已收進問診：這一句先暫時替你保管。";
      nextButton.disabled = false;
    });
    button.setAttribute("aria-pressed", String(currentAnswer === symptom));
    optionGrid.append(button);
  });

  backButton.disabled = state.current === 0;
  nextButton.disabled = !state.answers[state.current];
  nextButton.textContent = state.current === questions.length - 1 ? "留下處方" : "翻至下一頁";
  skipButton.textContent = state.current === questions.length - 1 ? "略過並看結果" : "略過這題";
}

function normalizeOptionMeaning(text = "") {
  return text
    .replace(/^像是在問[:：]\s*/, "")
    .replace(/^像是在說[:：]\s*/, "")
    .replace(/^這句靠近[:：]\s*/, "")
    .trim();
}

function keepQuizQuestionInView(behavior = "smooth") {
  requestAnimationFrame(() => {
    const headerHeight = document.querySelector(".site-header")?.getBoundingClientRect().height || 0;
    const cardRect = testCard.getBoundingClientRect();
    const availableHeight = window.innerHeight - headerHeight;
    const breathingRoom = window.matchMedia("(max-width: 560px)").matches ? 14 : 28;
    const desiredTop =
      testCard.offsetHeight + breathingRoom * 2 <= availableHeight
        ? headerHeight + Math.max(breathingRoom, (availableHeight - testCard.offsetHeight) / 2)
        : headerHeight + breathingRoom;
    const top = window.scrollY + cardRect.top - desiredTop;
    window.scrollTo({ top: Math.max(0, top), behavior });
  });
}

function showResult(symptom) {
  state.currentSymptom = symptom;
  const data = symptoms[symptom];
  const sortedScores = getSortedScores();
  const topScore = sortedScores[0][1];
  const second = sortedScores[1] || ["-", 0];
  const isFallback = symptom === fallbackSymptom;
  const clues = isFallback ? getMixedAnswerClues() : getAnswerClues(symptom);
  document.querySelector("#result-title").textContent = "處方已開立";
  document.querySelector("#result-category").textContent = data.category;
  document.querySelector("#result-symptom").textContent = symptom;
  document.querySelector("#result-summary-text").textContent = data.summary;
  document.querySelector("#result-explain").hidden = false;
  document.querySelector("#reason-main").textContent = buildReasonText(symptom, sortedScores);
  document.querySelector("#primary-score").textContent = isFallback
    ? "混合心緒｜未明顯集中"
    : `${symptom}｜${topScore} 題`;
  document.querySelector("#secondary-score").textContent = isFallback
    ? `${sortedScores[0][0]}｜曾短暫靠近`
    : `${second[0]}｜${second[1]} 題`;
  document.querySelector("#confidence-score").textContent = getConfidenceLabel(symptom, sortedScores);
  document.querySelector("#answer-clues").innerHTML = clues
    .map((clue) => `<li>${clue}</li>`)
    .join("");
  renderScoreList(sortedScores);
  renderDeepReading(deepReadings[symptom]);
  document.documentElement.style.setProperty("--wine", data.color);
  resultPaper.classList.remove("is-ready");
  requestAnimationFrame(() => resultPaper.classList.add("is-ready"));
  document.querySelector("#result").scrollIntoView({ behavior: "smooth", block: "start" });
}

function moveToNextQuestionOrResult() {
  if (state.current < questions.length - 1) {
    state.current += 1;
    renderQuestion();
    keepQuizQuestionInView("smooth");
    return;
  }

  showResult(getTopSymptom());
}

function renderDeepReading(reading) {
  const deepReading = document.querySelector("#deep-reading");
  if (!deepReading || !reading) return;

  const sections = [
    ["你此刻的內在天氣", reading.inner],
    ["你可能習慣的保護方式", reading.reaction],
    ["真正卡住你的地方", reading.hidden],
  ];

  deepReading.innerHTML = sections
    .map(
      ([title, text]) => `
        <article>
          <h4>${title}</h4>
          <p>${text}</p>
        </article>
      `,
    )
    .join("");
}

function renderScoreList(sortedScores) {
  const scoreList = document.querySelector("#score-list");
  const nearScores = sortedScores.filter(([, score]) => score > 0).slice(0, 3);
  scoreList.innerHTML = `
    <div class="score-note">
      <span>問診殘影</span>
      <p>除了主處方，這些方向也曾在你的答案裡短暫亮起。</p>
    </div>
    <div class="score-card-grid">
      ${nearScores
        .map(
          ([name, score], index) => `
            <article class="score-card" style="--score-color:${symptoms[name].color}; animation-delay:${index * 70}ms">
              <span>${index === 0 ? "最靠近" : "也靠近"}</span>
              <strong>${name}</strong>
              <em>${score} 次被選中</em>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function wrapCanvasText(ctx, text, maxWidth) {
  const paragraphs = text.split("\n");
  const lines = [];

  for (const paragraph of paragraphs) {
    let line = "";
    const chars = [...paragraph];
    if (!chars.length) {
      lines.push("");
      continue;
    }

    for (const char of chars) {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line = testLine;
      }
    }

    if (line) {
      lines.push(line);
    }
  }

  return lines;
}

function measureWrappedText(ctx, text, maxWidth, lineHeight) {
  return wrapCanvasText(ctx, text, maxWidth).length * lineHeight;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = Infinity) {
  const lines = wrapCanvasText(ctx, text, maxWidth).slice(0, maxLines);
  let currentY = y;

  lines.forEach((line) => {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  });

  return currentY;
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, width, height, radius);
    return;
  }

  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
}

function estimateResultImageHeight(details, width) {
  const measureCanvas = document.createElement("canvas");
  const ctx = measureCanvas.getContext("2d");

  ctx.font = '700 82px "Noto Serif TC", serif';
  const headerY = 270 + measureWrappedText(ctx, details.symptom, 840, 96);

  ctx.font = '500 36px "Noto Serif TC", serif';
  let y = headerY + 106 + measureWrappedText(ctx, details.summary, 840, 54);

  y += 34 + 48;
  ctx.font = '400 27px "Noto Sans TC", sans-serif';
  y += measureWrappedText(ctx, details.reason, 840, 42);

  y += 38 + 210;
  const deepSections = details.deep
    ? [details.deep.inner, details.deep.reaction, details.deep.hidden]
    : [];

  ctx.font = '400 24px "Noto Sans TC", sans-serif';
  deepSections.forEach((text) => {
    const textHeight = measureWrappedText(ctx, text, 780, 36);
    const sectionHeight = Math.max(188, 78 + textHeight + 42);
    y = y - 8 + sectionHeight + 70;
  });

  y += 6 + 46;
  ctx.font = '400 25px "Noto Sans TC", sans-serif';
  details.clues.slice(0, 3).forEach((clue) => {
    y += measureWrappedText(ctx, `・${clue}`, 840, 38) + 4;
  });

  return Math.max(2600, Math.ceil(y + 260));
}

function createResultImage(details, pixelRatio = Math.max(1, window.devicePixelRatio || 1)) {
  const canvas = document.createElement("canvas");
  const ratio = pixelRatio;
  const width = 1080;
  const height = estimateResultImageHeight(details, width);
  canvas.width = width * ratio;
  canvas.height = height * ratio;

  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  ctx.fillStyle = "#efe7d8";
  ctx.fillRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "rgba(55, 84, 101, 0.16)");
  gradient.addColorStop(0.5, "rgba(111, 63, 67, 0.08)");
  gradient.addColorStop(1, "rgba(100, 111, 91, 0.18)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(246, 241, 230, 0.88)";
  ctx.strokeStyle = "rgba(23, 33, 31, 0.18)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  drawRoundedRect(ctx, 70, 70, width - 140, height - 140, 34);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#6f3f43";
  ctx.font = '700 28px "Noto Sans TC", sans-serif';
  ctx.fillText("文學診療室｜心事快速檢測", 120, 150);

  ctx.fillStyle = "#17211f";
  ctx.font = '700 82px "Noto Serif TC", serif';
  let headerY = drawWrappedText(ctx, details.symptom, 120, 270, 840, 96);

  ctx.fillStyle = "#46504a";
  ctx.font = '700 30px "Noto Sans TC", sans-serif';
  ctx.fillText(details.category, 120, headerY + 22);

  ctx.fillStyle = "#34413d";
  ctx.font = '500 36px "Noto Serif TC", serif';
  let y = drawWrappedText(ctx, details.summary, 120, headerY + 106, 840, 54);

  y += 34;
  ctx.fillStyle = "#17211f";
  ctx.font = '700 32px "Noto Sans TC", sans-serif';
  ctx.fillText("為什麼會開出這張處方", 120, y);

  y += 48;
  ctx.fillStyle = "#34413d";
  ctx.font = '400 27px "Noto Sans TC", sans-serif';
  y = drawWrappedText(ctx, details.reason, 120, y, 840, 42);

  y += 38;
  ctx.fillStyle = "rgba(31, 51, 45, 0.08)";
  ctx.fillRect(120, y, 840, 150);
  ctx.fillStyle = "#62675f";
  ctx.font = '700 24px "Noto Sans TC", sans-serif';
  ctx.fillText("主要傾向", 150, y + 48);
  ctx.fillText("次要靠近", 560, y + 48);
  ctx.fillStyle = "#17211f";
  ctx.font = '700 32px "Noto Serif TC", serif';
  ctx.fillText(details.primary, 150, y + 96);
  ctx.fillText(details.secondary, 560, y + 96);

  y += 210;
  const deepSections = details.deep
    ? [
        ["你此刻的內在天氣", details.deep.inner],
        ["你可能習慣的保護方式", details.deep.reaction],
        ["真正卡住你的地方", details.deep.hidden],
      ]
    : [];

  deepSections.forEach(([title, text], index) => {
    const sectionTop = y - 8;
    const textStart = y + 78;
    const textHeight = measureWrappedText(ctx, text, 780, 36);
    const sectionHeight = Math.max(188, 78 + textHeight + 42);

    ctx.fillStyle = index === 3 ? "rgba(111, 63, 67, 0.10)" : "rgba(31, 51, 45, 0.06)";
    ctx.fillRect(120, sectionTop, 840, sectionHeight);
    ctx.fillStyle = "#17211f";
    ctx.font = '700 28px "Noto Sans TC", sans-serif';
    ctx.fillText(title, 150, y + 32);
    ctx.fillStyle = "#34413d";
    ctx.font = '400 24px "Noto Sans TC", sans-serif';
    y = drawWrappedText(ctx, text, 150, textStart, 780, 36);
    y = Math.max(y, sectionTop + sectionHeight);
    y += 70;
  });

  y += 6;
  ctx.fillStyle = "#17211f";
  ctx.font = '700 30px "Noto Sans TC", sans-serif';
  ctx.fillText("我的問診線索", 120, y);

  y += 46;
  ctx.fillStyle = "#34413d";
  ctx.font = '400 25px "Noto Sans TC", sans-serif';
  details.clues.slice(0, 3).forEach((clue) => {
    y = drawWrappedText(ctx, `・${clue}`, 120, y, 840, 38);
    y += 4;
  });

  ctx.fillStyle = "#62675f";
  ctx.font = '400 22px "Noto Sans TC", sans-serif';
  drawWrappedText(ctx, "這不是醫療診斷，而是一張由文字整理出的臨時處方箋。", 120, height - 120, 840, 34, 2);
  ctx.fillText(window.location.host, 120, height - 68);

  return canvas;
}

async function emailResult() {
  const details = getResultDetails();
  if (!details) {
    saveStatus.textContent = "請先完成測驗，再保存處方。";
    return;
  }

  const email = emailInput.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    saveStatus.textContent = "請先輸入有效的信箱。";
    emailInput.focus();
    return;
  }

  const originalText = emailResultButton.textContent;
  emailResultButton.disabled = true;
  emailResultButton.textContent = "寄送中...";
  saveStatus.textContent = "正在把文字版處方寄到你的信箱。";

  try {
    await sendEmailWithEmailJS(details, email);
    saveStatus.textContent = "已寄出，請到信箱收取文字版處方。若想保存圖片，可使用下方按鈕下載。";
  } catch (error) {
    console.error(error);
    saveStatus.textContent = getEmailErrorMessage(error);
  } finally {
    emailResultButton.disabled = false;
    emailResultButton.textContent = originalText;
  }
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

function showImageDialog() {
  if (!resultImageDataUrl) return;
  resultImagePreview.src = resultImageDataUrl;
  if (resultImageObjectUrl) URL.revokeObjectURL(resultImageObjectUrl);
  resultImageObjectUrl = resultImageBlob ? URL.createObjectURL(resultImageBlob) : "";
  openImageLink.href = resultImageObjectUrl || resultImageDataUrl;
  imageDialog.hidden = false;
  document.body.classList.add("has-dialog");
}

function closeImageDialog() {
  imageDialog.hidden = true;
  document.body.classList.remove("has-dialog");
}

function saveImageFile() {
  if (!resultImageDataUrl) {
    saveStatus.textContent = "請先產生處方圖。";
    return;
  }

  const link = document.createElement("a");
  link.download = resultImageFilename;
  link.href = resultImageDataUrl;
  document.body.append(link);
  link.click();
  link.remove();
  saveStatus.textContent = "已嘗試下載圖片。若手機沒有反應，請在預覽圖上長按保存。";
}

async function shareImageFile() {
  if (!resultImageBlob) {
    saveStatus.textContent = "請先產生處方圖。";
    return;
  }

  if (typeof File !== "function" || !navigator.canShare || !navigator.share) {
    saveStatus.textContent = "此瀏覽器不支援直接分享圖片，請長按預覽圖保存。";
    return;
  }

  const file = new File([resultImageBlob], resultImageFilename, { type: "image/png" });
  if (!navigator.canShare({ files: [file] })) {
    saveStatus.textContent = "此瀏覽器不支援直接分享圖片，請長按預覽圖保存。";
    return;
  }

  try {
    await navigator.share({
      files: [file],
      title: "文學診療室閱讀處方",
      text: "保存我的心事快速檢測處方。",
    });
    saveStatus.textContent = "已開啟分享選單。";
  } catch {
    saveStatus.textContent = "分享已取消，仍可長按預覽圖保存。";
  }
}

async function downloadResultImage() {
  const details = getResultDetails();
  if (!details) {
    saveStatus.textContent = "請先完成測驗，再下載處方圖。";
    return;
  }

  saveStatus.textContent = "正在產生處方圖...";
  await document.fonts?.ready;
  const canvas = createResultImage(details);
  resultImageFilename = `文學診療室-${details.symptom}-處方.png`;
  resultImageDataUrl = canvas.toDataURL("image/png");
  resultImageBlob = await canvasToBlob(canvas);
  showImageDialog();
  saveStatus.textContent = "處方圖已產生，手機可長按圖片保存。";
}

function resetQuiz() {
  state.current = 0;
  state.answers = Array(questions.length).fill(null);
  state.currentSymptom = null;
  renderQuestion();
  keepQuizQuestionInView("smooth");
}

nextButton.addEventListener("click", () => {
  if (!state.answers[state.current]) return;
  moveToNextQuestionOrResult();
});

skipButton.addEventListener("click", () => {
  state.answers[state.current] = null;
  moveToNextQuestionOrResult();
});

backButton.addEventListener("click", () => {
  if (state.current === 0) return;
  state.current -= 1;
  renderQuestion();
  keepQuizQuestionInView("smooth");
});

restartButton.addEventListener("click", resetQuiz);
emailResultButton.addEventListener("click", emailResult);
downloadResultButton.addEventListener("click", downloadResultImage);
saveImageButton.addEventListener("click", saveImageFile);
shareImageButton.addEventListener("click", shareImageFile);
imageDialogCloseButtons.forEach((button) => button.addEventListener("click", closeImageDialog));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !imageDialog.hidden) {
    closeImageDialog();
    return;
  }

  const isTyping = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName);
  if (isTyping || !document.body.classList.contains("has-entered") || !imageDialog.hidden) return;

  if (/^[1-4]$/.test(event.key)) {
    optionGrid.querySelectorAll(".option-button")[Number(event.key) - 1]?.click();
    return;
  }

  if (event.key === "Enter" && !nextButton.disabled) {
    nextButton.click();
  }
});

function drawAtmosphere(time = 0) {
  const canvas = document.querySelector("#atmosphere");
  const ctx = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.scale(ratio, ratio);
  }
  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "rgba(103, 124, 105, 0.22)");
  gradient.addColorStop(0.5, "rgba(111, 63, 67, 0.1)");
  gradient.addColorStop(1, "rgba(49, 72, 82, 0.18)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(31, 51, 45, 0.08)";
  ctx.lineWidth = 1;
  for (let y = 70; y < height; y += 72) {
    const drift = Math.sin(time * 0.0003 + y * 0.02) * 12;
    ctx.beginPath();
    ctx.moveTo(0, y + drift);
    ctx.bezierCurveTo(width * 0.25, y - 22, width * 0.65, y + 22, width, y - 8 - drift);
    ctx.stroke();
  }

  for (let i = 0; i < 18; i += 1) {
    const x = ((Math.sin(i * 12.1 + time * 0.00018) + 1) / 2) * width;
    const y = ((Math.cos(i * 8.7 + time * 0.00015) + 1) / 2) * height;
    ctx.beginPath();
    ctx.arc(x, y, 1.2 + (i % 3), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(238, 230, 214, 0.24)";
    ctx.fill();
  }

  requestAnimationFrame(drawAtmosphere);
}

async function startSound({ fromGesture = false } = {}) {
  try {
    await bgm.play();
    soundOn = !bgm.paused;
    soundButton.textContent = soundOn ? "BGM：播放中" : "BGM：點擊開啟";
    soundButton.setAttribute("aria-pressed", String(soundOn));
  } catch {
    soundOn = false;
    soundButton.textContent = fromGesture ? "BGM：無法播放" : "BGM：點擊開啟";
    soundButton.setAttribute("aria-pressed", "false");
  }
}

function stopSound() {
  bgm.pause();
  soundOn = false;
  soundButton.textContent = "BGM：已關閉";
  soundButton.setAttribute("aria-pressed", "false");
}

async function enterExperience() {
  document.body.classList.add("has-entered");
  await startSound({ fromGesture: true });
  window.setTimeout(() => {
    keepQuizQuestionInView("smooth");
  }, 360);
}

if (window.location.hash) {
  document.body.classList.add("has-entered");
}

enterButton?.addEventListener("click", enterExperience);
entryScreen?.addEventListener("click", (event) => {
  if (event.target === entryScreen) enterExperience();
});

soundButton.addEventListener("click", async () => {
  if (!soundOn) {
    await startSound({ fromGesture: true });
    return;
  }
  stopSound();
});

document.addEventListener(
  "pointerdown",
  () => {
    if (!soundOn) startSound({ fromGesture: true });
  },
  { once: true },
);

validateQuizConfiguration();
renderQuestion();
requestAnimationFrame(drawAtmosphere);
startSound();
window.addEventListener("load", () => startSound());
