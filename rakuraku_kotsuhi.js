const puppeteer = require('puppeteer');

// node rakuraku_kotsuhi.js [年] [月] [曜日] [除外する日]
// 例：node rakuraku_kotsuhi.js 2021 11 火水木 3,23

//if (!process.argv[2]) {
//  return console.log('出勤した年を入力してください');
//}

const year = Number(process.argv[2]);
const month = Number(process.argv[3]);
const day = String(process.argv[4]);
const excludeDate = String(process.argv[5]).split(',');

const dayOfWeekArray = [ "日", "月", "火", "水", "木", "金", "土" ];
const endOfMonth = new Date(year, month, 0).getDate();
const targetDate =
  Array
    .from(Array(endOfMonth).keys(), x => x + 1)
    .filter(date => excludeDate.indexOf(String(date)) === -1)
    .filter(date => day.includes(dayOfWeekArray[new Date(year, month - 1, date).getDay()]))
    .map(date => `${year}/${month}/${date}`);

console.log(targetDate);

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // ログイン
  // ログイン画面のURL(セキュリティの都合上消しました。おそらく皆さん同じURLかと思います。) 
  await page.goto('URL');
  await page.type('input[name="loginId"]', 'ログインID'); // ログインID
  await page.type('input[name="password"]', 'パスワード'); // パスワード
  page.click('#submitBtn');
  await page.waitForTimeout(2000);
  console.log('ログインが完了しました');

  // 交通費精算
  // 交通費精算のURL(セキュリティの都合上消しました。おそらく皆さん同じURLかと思います。) ~/sapKotsuhiDenpyo/initializeView の部分
  await page.goto('URL');

  for (let i = 0; i < targetDate.length; i++) {
    page.click('button.meisai-insert-button--direct-add');
    await page.waitForTimeout(1500);

    // 日付
    await page.keyboard.type(targetDate[i]);
    // 出発地点
    await page.type('input[name="startPoint"]', '三田駅');
    // 到着地点
    await page.type('input[name="arrivalPoint"]', '六本木一丁目駅');
    // 金額
    await page.type('input[name="kingaku"]', '276');
    // 往復/片道
    await page.select('select[name="ohukuKbn"]', '1'); // 0 = 片道, 1 = 往復
    // 目的地
    await page.type('input[name="meisaiDestination"]', 'Headquarters（東京本社）');
    // 交通機関
    await page.select('select[name="kotsukikan"]', '74'); // 74 = 電車（国内）, 78 = バス（国内）
    // 目的（詳細）
    await page.type('input[name="meisaiFreeText1"]', '通勤');

    page.click('button.insertMeisai');
    await page.waitForTimeout(1000);

    console.log(`${targetDate[i]} の交通費明細を作成しました`);
  }

  // 一時保存
  page.click('button.save');
  await page.waitForTimeout(1000);
  console.log('明細を作成し一時保存しました');

  await browser.close();
})();

