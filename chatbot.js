/* Saffron Concierge: shared, rules-based dining recommendation assistant. */
(() => {
  'use strict';

  const imageRoot = 'website%20images/';
  const dishes = [
    ['Smoked Burrata',1800,'Charred heirloom tomatoes, basil oil, saffron ash','smoked_burrata.webp.png',true,false,true,true,false,'starter'],
    ['Tandoori Prawns',2400,'Clay-oven prawns, smoked chilli butter, pickled onion','tandoori_prawns.webp.png',false,true,false,true,false,'starter'],
    ['Truffle Mushroom Tikka',1900,'Wood-roasted mushrooms, truffle glaze, smoked salt','truffle_mushroom_tikka.webp.png',true,false,false,true,false,'starter'],
    ['Smoked Tomato Shorba',1200,'Slow-roasted tomatoes, coriander oil, crisp garlic','smoked_tomato_shorba.webp.png',true,false,true,true,false,'salad'],
    ['Charred Citrus Salad',1400,'Flame-kissed greens, orange segments, pistachio crumble','charred_citrus_salad.webp.png',true,false,true,true,false,'salad'],
    ['Saffron Smoke Platter',2200,'Paneer, vegetables and skewers finished over live fire','saffron_smoke_platter.webp.png',true,false,false,true,false,'sizzler'],
    ['Pepper Garlic Prawns',2800,'Charred prawns, roasted garlic, black pepper glaze','pepper_garlic_prawns.webp.png',false,true,false,true,false,'sizzler'],
    ['Saffron Lamb',3400,'Slow-cooked lamb, saffron jus, smoked garlic','saffron_lamb.webp.png',false,false,false,true,false,'main'],
    ['Charcoal Paneer',2100,'Fire-roasted paneer, makhani reduction, burnt chilli','charcoal_paneer.webp.png',true,true,false,true,false,'main'],
    ['Smoked Dal Makhani',1600,'24-hour slow-cooked black lentils, churned butter','smoked_dalmakhni.webp.png',true,false,false,true,false,'main'],
    ['Truffle Naan',800,'Layered flatbread, fresh truffle, cultured butter','truffle_naan.webp.png',true,false,false,false,false,'bread'],
    ['Saffron Pulao',1100,'Aged basmati, Kashmiri saffron, toasted nuts','saffron_pulao.webp.png',true,false,false,false,false,'bread'],
    ['Smoked Vanilla Bean Ice Cream',1200,'House-churned Madagascar vanilla, salted caramel','smoked_vanila_bean_ice_cream.webp.png',true,false,false,true,true,'dessert'],
    ['Gold Leaf Rasmalai',1500,'Saffron milk, pistachio, 24k gold','gold_leaf_rasmalai.webp.png',true,false,false,false,true,'dessert']
  ].map(([name,price,description,image,vegetarian,spicy,light,smoky,dessert,category]) => ({ name, price, description, image: imageRoot + image, vegetarian, spicy, light, smoky, dessert, category, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }));

  const boot = () => {
    const root = document.getElementById('chatbot-container');
    if (!root) return;
    const launcher = document.getElementById('chatbot-toggle');
    const help = document.getElementById('chatbot-help');
    const helpOpen = document.getElementById('chatbot-help-open');
    const helpDismiss = help.querySelector('.chatbot-help-dismiss');
    const windowEl = document.getElementById('chatbot-window');
    const close = document.getElementById('chatbot-close');
    const messages = document.getElementById('chatbot-messages');
    const form = document.getElementById('chatbot-form');
    const input = document.getElementById('chatbot-input');
    const avatar = 'assets/images/concierge-avatar.svg';
    let previousFocus = launcher;
    let started = false;
    let shown = new Set();
    let state;

    const resetState = () => { state = { dietary: null, spicy: null, smoky: null, light: null, dessert: null, category: null, maxPrice: null, spiceLevel: null }; };
    resetState();

    // Anchor menu items without changing their visual design; supports direct card links.
    document.querySelectorAll('.menu-item').forEach(item => {
      const title = item.querySelector('.menu-item-name');
      if (!title) return;
      const dish = dishes.find(entry => entry.name === title.textContent.trim());
      if (dish) item.id = dish.slug;
    });
    if (location.hash && document.getElementById(location.hash.slice(1))) setTimeout(() => document.getElementById(location.hash.slice(1)).scrollIntoView({ block: 'center' }), 0);

    const scroll = () => { messages.scrollTop = messages.scrollHeight; };
    const element = (tag, className, text) => { const el = document.createElement(tag); if (className) el.className = className; if (text !== undefined) el.textContent = text; return el; };
    const clearReplies = () => messages.querySelectorAll('.chat-quick-replies').forEach(el => el.remove());

    const addMessage = (text, who = 'bot') => {
      const row = element('div', `chat-message ${who}`);
      if (who === 'bot') { const image = document.createElement('img'); image.className = 'chat-message-avatar'; image.src = avatar; image.alt = ''; row.append(image); }
      row.append(element('div', 'chat-message-bubble', text)); messages.append(row); scroll();
    };
    const addTyping = () => {
      const typing = element('div', 'chat-typing'); typing.id = 'chatbot-typing';
      typing.append(document.createTextNode('Saffron Concierge is thinking'));
      const dots = element('span', 'chat-typing-dots'); ['','',''].forEach(() => dots.append(element('span'))); typing.append(dots); messages.append(typing); scroll();
      return typing;
    };
    const respond = (fn) => { const typing = addTyping(); setTimeout(() => { typing.remove(); fn(); }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350); };
    const addReplies = (options) => {
      clearReplies(); const box = element('div', 'chat-quick-replies');
      options.forEach(({ label, action }) => { const button = element('button', 'chat-quick-reply', label); button.type = 'button'; button.addEventListener('click', () => { clearReplies(); addMessage(label, 'user'); action(); }); box.append(button); });
      messages.append(box); scroll();
    };
    const initialOptions = () => addReplies([
      { label: '🌱 Vegetarian', action: () => { state.dietary = 'vegetarian'; vegetarianFollowup(); } },
      { label: '🍤 Non-Vegetarian', action: () => { state.dietary = 'non-vegetarian'; proteinFollowup(); } },
      { label: '🔥 Something Smoky', action: () => { state.smoky = true; recommend(); } },
      { label: '🌶️ Something Spicy', action: spicyFollowup }, { label: '🥗 Something Light', action: () => { state.light = true; recommend(); } },
      { label: '🍰 Dessert', action: dessertFollowup }, { label: '👨‍🍳 Surprise Me', action: surprise }
    ]);
    const vegetarianFollowup = () => respond(() => { addMessage('Great choice! What kind of experience are you looking for?'); addReplies([
      { label: '🔥 Smoky & Grilled', action: () => { state.smoky = true; recommend(); } }, { label: '🍛 Comforting', action: () => { state.light = false; recommend(); } },
      { label: '🥗 Light & Fresh', action: () => { state.light = true; recommend(); } }, { label: '✨ Surprise Me', action: surprise }
    ]); });
    const proteinFollowup = () => respond(() => { addMessage('Excellent. How would you like your dish to feel?'); addReplies([
      { label: '🔥 Smoky & Grilled', action: () => { state.smoky = true; recommend(); } }, { label: '🌶️ A Little Heat', action: spicyFollowup },
      { label: '🍛 Comforting', action: () => { state.light = false; recommend(); } }, { label: '✨ Surprise Me', action: surprise }
    ]); });
    function spicyFollowup() { respond(() => { addMessage('How adventurous are you feeling?'); addReplies([
      { label: '🌶️ Mild', action: () => { state.spicy = false; state.spiceLevel = 'mild'; recommend(); } }, { label: '🔥 Medium', action: () => { state.spicy = true; state.spiceLevel = 'medium'; recommend(); } },
      { label: '🔥🔥 Bold', action: () => { state.spicy = true; state.spiceLevel = 'bold'; recommend(); } }
    ]); }); }
    function dessertFollowup() { state.dessert = true; state.category = 'dessert'; respond(() => { addMessage('What kind of sweet ending are you looking for?'); addReplies([
      { label: '🍦 Creamy', action: () => { state.smoky = true; recommend(); } }, { label: '✨ Something Special', action: () => { state.smoky = false; recommend(); } }, { label: '👨‍🍳 Surprise Me', action: surprise }
    ]); }); }
    const matches = () => dishes.filter(dish => {
      if (state.dietary === 'vegetarian' && !dish.vegetarian) return false;
      if (state.dietary === 'non-vegetarian' && dish.vegetarian) return false;
      if (state.spicy !== null && dish.spicy !== state.spicy) return false;
      if (state.smoky !== null && dish.smoky !== state.smoky) return false;
      if (state.light !== null && dish.light !== state.light) return false;
      if (state.dessert === true && !dish.dessert) return false;
      if (state.dessert === false && dish.dessert) return false;
      if (state.category && dish.category !== state.category) return false;
      return state.maxPrice === null || dish.price <= state.maxPrice;
    });
    const closest = () => dishes.map(dish => ({ dish, score: [state.dietary === 'vegetarian' ? dish.vegetarian : state.dietary === 'non-vegetarian' ? !dish.vegetarian : true, state.smoky === null || dish.smoky === state.smoky, state.spicy === null || dish.spicy === state.spicy, state.light === null || dish.light === state.light, state.dessert === null || dish.dessert === state.dessert, state.maxPrice === null || dish.price <= state.maxPrice].filter(Boolean).length })).sort((a,b) => b.score - a.score).map(entry => entry.dish);
    const addCard = dish => {
      const card = element('article', 'chat-recommendation');
      const image = document.createElement('img'); image.src = dish.image; image.alt = `${dish.name}, recommended dish`; image.loading = 'lazy'; card.append(image);
      const content = element('div', 'chat-recommendation-content'); content.append(element('h5', 'chat-recommendation-title', dish.name), element('p', 'chat-recommendation-price', `₹${dish.price.toLocaleString('en-IN')}`), element('p', 'chat-recommendation-description', dish.description));
      const actions = element('div', 'chat-recommendation-actions'); const why = element('button', 'rec-btn', 'Why this?'); why.type = 'button'; why.addEventListener('click', () => explanation(dish)); const link = element('a', 'rec-btn', 'View in Menu'); link.href = `menu.html#${dish.slug}`; actions.append(why, link); content.append(actions); card.append(content); messages.append(card); scroll();
    };
    const explanation = dish => {
      const reasons = [];
      if (state.dietary === 'vegetarian' && dish.vegetarian) reasons.push('it is vegetarian');
      if (state.dietary === 'non-vegetarian' && !dish.vegetarian) reasons.push('it features premium meat or seafood');
      if (state.smoky && dish.smoky) reasons.push('it has the smoky, fire-kissed character you asked for');
      if (state.spicy && dish.spicy) reasons.push('it brings the heat you requested');
      if (state.spicy === false && !dish.spicy) reasons.push('it keeps the spice gentle');
      if (state.light && dish.light) reasons.push('it is light and fresh');
      if (state.dessert && dish.dessert) reasons.push('it gives you the sweet finish you wanted');
      if (state.maxPrice && dish.price <= state.maxPrice) reasons.push(`it is within your ₹${state.maxPrice.toLocaleString('en-IN')} budget`);
      if (!reasons.length) reasons.push(dish.smoky ? 'it is one of our signature fire-kissed specialties' : 'it is a chef favourite');
      addMessage(`I recommended ${dish.name} because ${reasons.join(', ').replace(/, ([^,]*)$/, ' and $1')}.`);
    };
    const refineOptions = () => { addMessage('Want me to narrow it down?'); addReplies([
      { label: '💰 Under ₹2,000', action: () => { state.maxPrice = 2000; recommend(); } }, { label: '🔥 More Smoky', action: () => { state.smoky = true; recommend(); } },
      { label: '🌶️ More Spicy', action: () => { state.spicy = true; recommend(); } }, { label: '🥗 Something Lighter', action: () => { state.light = true; recommend(); } },
      { label: '🍰 Show Desserts', action: dessertFollowup }, { label: '🔄 Show More', action: () => recommend(true) }, { label: '🎯 Refine My Choice', action: askRefinement },
      { label: '✨ Surprise Me', action: surprise }, { label: '📖 View Full Menu', action: () => { location.href = 'menu.html'; } }, { label: '🔁 Start Over', action: start }
    ]); };
    function recommend(more = false) { respond(() => { const valid = matches(); const pool = valid.length ? valid : closest(); const fresh = pool.filter(dish => !shown.has(dish.name)); if (more && !fresh.length) { addMessage("You've seen every matching dish. Try refining your choice, or let me surprise you."); refineOptions(); return; } const selection = (fresh.length ? fresh : pool).slice(0, more ? 3 : 2); if (!valid.length) addMessage("I couldn't find an exact match, but these are the closest options."); else addMessage(more ? 'Here are a few more ideas for you.' : 'Based on your preferences, I recommend:'); selection.forEach(dish => { shown.add(dish.name); addCard(dish); }); refineOptions(); }); }
    function surprise() { respond(() => { const valid = matches(); const pool = (valid.length ? valid : dishes).filter(dish => !shown.has(dish.name)); const dish = (pool.length ? pool : (valid.length ? valid : dishes))[Math.floor(Math.random() * (pool.length ? pool.length : (valid.length ? valid : dishes).length))]; addMessage("A lovely choice—I'd put this in front of you tonight:"); shown.add(dish.name); addCard(dish); refineOptions(); }); }
    function askRefinement() { respond(() => { addMessage('Tell me a preference or choose a direction below—for example, “vegetarian under 2500” or “not spicy”.'); initialOptions(); }); }
    function start() { resetState(); shown = new Set(); messages.replaceChildren(); addMessage('Welcome to Saffron & Smoke 🔥\n\nNot sure what to order? Tell me what you’re craving and I’ll help you find the perfect dish.'); respond(() => { addMessage('What are you in the mood for?'); initialOptions(); }); }
    const parse = raw => {
      const text = raw.toLowerCase(); const update = {};
      if (/don'?t\s+(eat|want).*non[- ]?veg|no\s+non[- ]?veg/.test(text)) update.dietary = 'vegetarian';
      else if (/(vegetarian|\bveg\b)/.test(text) && !/non[- ]?veg/.test(text)) update.dietary = 'vegetarian';
      else if (/non[- ]?veg|meat|seafood|prawn|lamb/.test(text)) update.dietary = 'non-vegetarian';
      if (/don'?t\s+want.*spicy|not\s+spicy|no\s+spice/.test(text)) update.spicy = false; else if (/spicy|hot|heat/.test(text)) update.spicy = true;
      if (/don'?t\s+want.*heavy|not\s+heavy/.test(text)) update.light = true; else if (/\blight|fresh|salad/.test(text)) update.light = true; else if (/heavy|comforting|comfort/.test(text)) update.light = false;
      if (/smoky|smokey|smoke|grilled|charcoal|fire[- ]?roast/.test(text)) update.smoky = true;
      if (/don'?t\s+want.*dessert|no\s+dessert/.test(text)) { update.dessert = false; update.category = null; } else if (/dessert|sweet|ice cream|rasmalai/.test(text)) { update.dessert = true; update.category = 'dessert'; }
      const price = text.match(/(?:under|below|less than)\s*(?:₹|rs\.?\s*)?(\d{3,5})/); if (price) update.maxPrice = Number(price[1]);
      return update;
    };
    const handleText = () => { const raw = input.value.trim(); if (!raw) return; input.value = ''; clearReplies(); addMessage(raw, 'user'); if (/start over|reset|restart/.test(raw.toLowerCase())) { start(); return; } if (/surprise|chef'?s? choice/.test(raw.toLowerCase())) { surprise(); return; } const updates = parse(raw); if (Object.keys(updates).length) { Object.assign(state, updates); recommend(); } else respond(() => { addMessage("I can help with dietary choices, spice, smoke, lighter dishes, desserts, or a budget. What sounds good?"); initialOptions(); }); };
    const open = () => { previousFocus = document.activeElement; windowEl.hidden = false; launcher.setAttribute('aria-expanded', 'true'); help.classList.remove('is-visible'); if (!started) { started = true; start(); } setTimeout(() => input.focus(), 0); };
    const closeChat = () => { windowEl.hidden = true; launcher.setAttribute('aria-expanded', 'false'); launcher.focus(); };
    launcher.addEventListener('click', open); close.addEventListener('click', closeChat); helpOpen.addEventListener('click', open); helpDismiss.addEventListener('click', () => help.classList.remove('is-visible'));
    form.addEventListener('submit', event => { event.preventDefault(); handleText(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !windowEl.hidden) { event.preventDefault(); closeChat(); } });
    setTimeout(() => { if (!started) help.classList.add('is-visible'); }, 2600);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
