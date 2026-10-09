# kids-breakfast

Fun breakfast tools for the family.

## Breakfast Wheel

Live at https://uxandyphil.github.io/kids-breakfast/ (or open `index.html` in any browser).

### Spin tab (made for little ones)
- Big pictures on every slice, flashing lights, a clicking pointer, and a giant **🎡 SPIN!** button —
  or just tap the wheel.
- When it stops: confetti, a fanfare, the breakfast's picture bouncing on screen, and the name read out loud.
  Tap 🔊 in the top corner to mute.
- Then it's your little one's turn, with big picture cards (tap as many as they like — each one is read aloud):
  1. **What fruit do you want?** — Blueberries, Blackberries, Bananas, Raspberries (edit the list in the Menu tab)
  2. **What are your favorite colors?** — 12 colors including Rainbow
  3. **How are you feeling?** — 12 feelings: Happy, Excited, Silly, Loved, Proud, Calm, Sleepy, Hungry, Shy, Sad, Mad, Scared
  4. **Yummy! Let's eat!** — shows everything they picked. ("Skip" in the corner jumps straight to the plate.)
- The plate card below shows the balanced meal with their fruit pick (or a random fruit if skipped), their
  colors and feelings, plus tips. Heavier meals get a "balance it out" tag.
- Tap **"We're having this!"** to log it. Breakfasts marked **once a week** (like Go out to DK) are
  greyed out with a 🔒 once they've been logged that week (Monday–Sunday).

### History tab
- What you've had recently (with the fruit, colors, and feelings picked) plus a count for the last 7 days
  and a "How we felt" summary. Tap ✕ to remove a mistake
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
