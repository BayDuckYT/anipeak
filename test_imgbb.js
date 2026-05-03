const IMGBB_KEYS = [
  'f86ef28239e9e9c876182dcbab114489',
  '61aac4bb998738d36994eb94bec61b3d',
  'c8aa007b2512bd5b4a97925acf9212a8'
];

async function test() {
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  for (const key of IMGBB_KEYS) {
    const form = new FormData();
    form.append('image', base64);
    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
        method: 'POST',
        body: form
      });
      const json = await res.json();
      console.log(key, '->', json.success ? 'SUCCESS' : json.error.message);
    } catch (e) {
      console.log(key, '-> ERROR', e.message);
    }
  }
}

test();
