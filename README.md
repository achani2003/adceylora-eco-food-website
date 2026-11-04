# ADCEYLORA ECO FOOD - Supabase Connected Smart Inventory System

මෙම පද්ධතිය **ADCEYLORA ECO FOOD** ව්‍යාපාරික සන්නාමය සඳහා Supabase Cloud PostgreSQL Database සමඟ සම්බන්ධ කර සකස් කරන ලද සම්පූර්ණ නිෂ්පාදන, තොග, POS සහ AI අනාවැකි කළමනාකරණ පද්ධතියකි.

## ඇතුළත් කර ඇති ගොනු:
```
ADCEYLORA_ECO_FOOD_Supabase_System/
│
├── index.html              # ප්‍රධාන වෙබ් පිටුව (Supabase Client, Dashboard, POS, Reports)
├── schema.sql              # Supabase SQL Editor එකේ run කළ යුතු නිල Database Script එක
├── css/
│   └── style.css           # Eco-Green Premium Dark/Light CSS Theme
├── js/
│   ├── app.js              # Supabase Cloud CRUD, Realtime Sync, POS සහ AI ඇල්ගොරිතමය
│   └── chart-config.js     # පසුගිය දින 7 ක සත්‍ය විකුණුම් ගණනය කරන Chart.js වින්‍යාසය
└── README.md               # පද්ධතිය සැකසීමේ උපදෙස් පත්‍රිකාව
```

## සක්‍රීය කර ඇති නවීන අංග:
1. **Supabase Cloud Database & Multi-Device Realtime Sync:**
   - භාණ්ඩ එකතු කිරීම, තොග වෙනස්වීම් සහ විකුණුම් තත්‍ය කාලීනව ක්ලවුඩ් ඩේටාබේස් එකට එකතු වේ.
2. **නිෂ්පාදන එකතු කළ දිනය (Added Date Display):**
   - නාමාවලියේ සහ තොග ලැයිස්තුවේ සෑම භාණ්ඩයක් සඳහාම එකතු කළ දිනය දර්ශනය වේ.
3. **මුද්‍රණය අවශ්‍ය නොවන සෘජු PDF බාගත කිරීම් (Direct Download as PDF):**
   - බිල්පත් (Invoices) සහ විකුණුම් වාර්තා (Sales Reports) Print Dialog එකකින් තොරව එක් ක්ලික් එකකින් සුපැහැදිලි PDF ගොනු ලෙස Download වේ.
4. **වාර්තා සඳහා Date Range Filtering:**
   - කැමති ආරම්භක සහ අවසන් දිනයක් තෝරා එම කාල සීමාවේ ආදායම සහ විකුණුම් පමණක් වෙන් කර බලාගැනීමට සහ PDF/CSV ලෙස බාගත කිරීමට හැකියාව ඇත.
5. **සත්‍ය විකුණුම් ප්‍රස්ථාරය (Actual Rolling 7-day Sales Trend):**
   - පසුගිය දින 7 ක සත්‍ය විකුණුම් ගනුදෙනු පදනම් කරගෙන ප්‍රස්ථාරය ගතිකව ඇඳේ.

## Supabase සම්බන්ධ කරගන්නේ කෙසේද (Quick Setup):
1. **schema.sql** ගොනුව විවෘත කර එහි ඇති සම්පූර්ණ SQL කේතය ඔබගේ Supabase Dashboard හි **SQL Editor** එකට Paste කර Run කරන්න.
2. Supabase හි **Project Settings -> API** වෙත ගොස් **Project URL** සහ **anon/public API key** පිටපත් කරගන්න.
3. **`js/app.js`** ගොනුවේ ඉහළ ඇති placeholder අගයන් දෙක සඳහා ඒවා ආදේශ කරන්න:
   ```javascript
   const SUPABASE_URL = 'https://your-project.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key';
   ```
4. දැන් `index.html` බ්‍රවුසරයකින් විවෘත කරන්න. Sidebar එකෙහි **Supabase Cloud Online** ලෙස කොළ පැහැයෙන් දිස්වනු ඇත!
