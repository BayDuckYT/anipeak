import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
  const { data } = await axios.get("https://paradoxscans.com/seri/the-lords-coins-arent-decreasing/bolum-50/");
  let match = data.match(/https:\/\/[^"'\\]+\/init-manga\/[^"'\\]+\.(jpg|jpeg|png|webp)/gi);
  if (match) {
     console.log("Pages:", match);
  } else {
     // fallback
     match = data.match(/https:\/\/[^"'\\]+\/wp-content\/uploads\/[^"'\\]+\.(jpg|jpeg|png|webp)/gi);
     if (match) {
       console.log("Fallback Found:", match.filter(url => !url.includes('-180x') && !url.includes('-150x') && url.includes('bolum') || url.includes('init')));
     }
  }
}
test();
