# kids-breakfast

Fun breakfast tools for the family.

## Breakfast Wheel

Live at https://uxandyphil.github.io/kids-breakfast/ (or open `index.html` in any browser).

### Home (made for little ones)
Big picture tiles your toddler can tap in any order. Whatever they pick shows right on the tile (with a ✓),
so the Home screen becomes "today at a glance". Picks reset each new day and are kept in History.

- **🎡 Spin for breakfast** — opens the wheel: big pictures, flashing lights, a clicking pointer, then confetti,
  a fanfare, and the breakfast read out loud. The last spin of the day is today's breakfast.
- **☀️ Morning jobs** — a checklist: Eat breakfast, Go potty, Get dressed, Brush teeth. Each tap is saved right
  away ("Yay! You brushed your teeth!"), the tile shows how many are done, and finishing all four gets confetti
- **🌦️ What to wear** — checks the weather for zip 43212 (Columbus, OH) and shows the clothes to put on:
  coat, warm hat, and mittens when it's cold; raincoat, rain boots, and umbrella when rain is likely; shorts,
  sun hat, and sunscreen when it's hot. Tap each one when it's on. Uses the free [Open-Meteo](https://open-meteo.com)
  forecast (no account needed), refreshed every 30 minutes. To use a different place, change `WEATHER_PLACE`
  in `index.html`.
- **🍓 Fruit** — Blueberries, Blackberries, Bananas, Raspberries (edit the list in the Menu tab)
- **😊 Feelings** — 12 feelings: Happy, Excited, Silly, Loved, Proud, Calm, Sleepy, Hungry, Shy, Sad, Mad, Scared
- **🎨 Colors** — 12 colors including Rainbow
- **🛴 Walk** — what to take on the morning walk: Scooter, Bike, Wagon, Stroller
- **🐶 Animal** — favorite animal today (40 animals). Each one makes its noise when tapped ("Dog! Woof woof!"),
  in a deep voice for big animals and a squeaky one for small ones, with sound effects like a roar, buzz,
  hiss, bubbles, or an elephant trumpet
- **👾 Monster** — favorite monster today (23): Ghost, Space Monster, Dragon, Alien, Troll, Vampire, Zombie,
  Sea Monster, Robot Monster, Mummy, Yeti, Cyclops, Slime Monster, Ogre, Goblin, Skeleton, Witch, Werewolf,
  Pumpkin Monster, Loch Ness Monster, Giant Spider, Bat Monster, Genie. Troll, Mummy, Yeti, Cyclops, and Slime
  are drawn pictures, so they show up on every phone.
- **🎃 Halloween** — how many days until Halloween, with one pumpkin per day to count

Every question is multi-select with big cards that bounce and are read aloud. **Done** only works once at least
one picture is chosen (otherwise the cards wiggle and it says "Tap a picture first!"). The button stays pinned
to the bottom of the screen, even on long lists like the animals. The 🏠 button goes back
home without saving. The page behind a dialog can't be scrolled. Tap 🔊 in the top corner to mute.

Taps are toddler-proof: a wobbly finger still counts as a tap, and holding a picture for about half a second
counts too. Only a real swipe scrolls.

Below the tiles, grown-ups get **Today's plate**: the balanced meal with the fruit your little one picked
(or a suggestion), plus tips. Heavier meals get a "balance it out" tag. Breakfasts marked **once a week**
(like Go out to DK) are greyed out with a 🔒 once they've been today's breakfast that week (Monday–Sunday).

### History tab
- One row per day: the breakfast plus everything picked on the Home tiles, a breakfast count for the last
  7 days, and a "How we felt" summary. Tap ✕ to remove a mistake
  (removing this week's DK entry unlocks DK again).

### Menu tab
- Edit any breakfast's name, picture (emoji), color, plate items, and tip; tick "once a week" / "heavier meal".
- Add, remove, or reorder breakfasts, and edit the fruit list. Changes save automatically.

## Sync across devices

Without sync, each phone/tablet keeps its own menu and history. To share them, set up a free
[Supabase](https://supabase.com) project once (about 5 minutes):

1. Sign up at https://supabase.com and click **New project** (any name, e.g. `kids-breakfast`; the free plan is fine).
2. When it's ready, open **SQL Editor** → **New query**, paste everything from
   [`supabase-setup.sql`](supabase-setup.sql), and click **Run**.
3. Open **Project Settings → API Keys** (or the **Connect** button) and copy:
   - the **Project URL** (looks like `https://abcd1234.supabase.co`)
   - the **publishable** key (`sb_publishable_…`) — or the legacy **anon public** key (`eyJ…`)
4. In the Breakfast Wheel, go to **✏️ Menu → ☁️ Sync across devices**, paste both, tap **Make one**
   for the family code, then **Connect**. The pill at the top changes to **☁️ Synced**.
5. Tap **📋 Copy setup link** and open that link on every other phone or tablet — they connect automatically.

Notes:
- The family code acts like a password: anyone with the setup link can see and change your breakfast data,
  so only share it with family. The database itself can't be browsed without the code.
- Devices check for changes every 15 seconds and whenever the app is reopened. If a device is offline,
  its changes are saved locally and sent when it reconnects.
- Never use the `service_role` / secret key in the app — only the publishable/anon key.

## Fridge, TV, and older browsers

The app is tuned to run on a Samsung Family Hub fridge (Tizen browser) and other older or slower browsers:

- The script uses only widely supported JavaScript (no `async`/`await`, no newer regex features), so an
  older browser can't choke on a single line and leave a blank screen.
- CSS has fallbacks for features older browsers lack (`aspect-ratio`, `min()`/`clamp()`, flexbox `gap`,
  conic gradients, `dvh`).
- On big landscape screens (900px and wider) Home shows 4 tiles across and pickers show up to 6 cards per row.
- On fridges/TVs (detected from the browser), slow devices, or with "reduce motion" on, endless animations
  are turned off and confetti is lighter. Add `?fridge=1` to the address once to force this mode on a device
  (`?fridge=0` turns it off).
- Because a fridge screen is always on, the app checks every minute for a new day (fresh tiles, new greeting,
  Halloween countdown) and refreshes the weather every 30 minutes.
