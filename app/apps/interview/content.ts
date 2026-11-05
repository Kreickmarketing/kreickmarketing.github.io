// Content for the interview drill (Head of Design, AI-First).
// Every answer has the same shape: Concept, Proof, How, Result, plus a "say it" script.

export type Question = {
  c: string;
  q: string;
  read?: "broken" | "trade";
  concept: string;
  proof: string;
  how: string[];
  result: string;
  say: string;
};

export const QUESTIONS: Question[] = [
  { c: "Experience", q: "Walk me through a design change you shipped that moved a conversion metric. What was the number before, and after?",
    concept: "One idea, one action.", proof: "PayPal email campaign: 17% to 54% click-through.",
    how: ["Cut each email to one idea.", "One call to action.", "Spread the content across more emails."],
    result: "Click-through more than tripled.",
    say: "At PayPal, I took an email campaign from 17% to 54% click-through. We cut each email down to one idea and one call to action, then spread the content across more emails in the sequence." },
  { c: "Experience", q: "Tell me about the largest team you've led. How did you set the quality bar, and how did you hold people to it?",
    concept: "Clear shared outcomes. Bi-weekly reviews.", proof: "20-person team at a publisher.",
    how: ["Set clear outcomes the whole team shares.", "Let each person own how they deliver their part.", "Review progress against the outcomes every two weeks."],
    result: "360 days down to 16 weeks, and 4 books on time.",
    say: "I led a 20-person team at a publisher. I set the bar with clear outcomes the whole team shared, then reviewed progress against them every two weeks. We cut launch time from 360 days to 16 weeks and delivered 4 books on time." },
  { c: "Role knowledge", q: "Our mattress product page converts well on desktop but 30 percent worse on mobile. What are the first three things you check?",
    concept: "Speed, above the fold, then the data.", proof: "A 30% gap points to the mobile experience, not the product.",
    how: ["Check mobile load time and image weight.", "Price, trial offer and Add to Cart visible without scrolling, and the button stays on screen.", "Compare the funnel by device and watch session recordings."],
    result: "You find the exact step where mobile visitors drop off.",
    say: "First, speed: mobile load time and image weight. Second, what's visible without scrolling: can you see the price, the trial offer and Add to Cart, and does the button stay on screen as you scroll? Third, the data: compare the funnel by device and watch session recordings to find exactly where mobile visitors drop off." },
  { c: "Role knowledge", q: "A test variant shows plus 8 percent add-to-cart after three days, at p equals 0.04. Do you ship it? Why or why not?",
    concept: "Not yet: too short, wrong metric.", proof: "p = 0.04 passes the 0.05 bar, but 3 days isn't a full week, and an add-to-cart isn't a sale.",
    how: ["Set the sample size before the test starts.", "Run at least two full weeks.", "Judge it on completed orders and revenue per visitor."],
    result: "Ship only if the sales hold up, not just the clicks.",
    say: "Not yet. A p-value of 0.04 clears the 0.05 bar, but three days is too short. It doesn't cover a full week, and an add-to-cart isn't a sale. I'd set the sample size before the test starts, then run at least two full weeks and ship if completed orders and revenue per visitor hold up." },
  { c: "Role knowledge", q: "How would you set up a design system so a small team plus AI tools can ship on-brand work fast, without losing accessibility?",
    concept: "Audit the good, remove the clutter, create tokens, load into Claude, check.", proof: "26 years of branding companies. Same craft, now faster and at scale with AI.",
    how: ["Load the full brand into Claude and have it find what's consistent: logos, fonts, colour, image and video style, spacing, icons, illustration.", "People decide and curate the results, and every colour pair is checked for WCAG contrast.", "Feed the approved set back into Claude as tokens for all future design."],
    result: "La Palabra shipped a 30-day social campaign of 240+ posts in two weeks.",
    say: "I've branded companies for 26 years. It's the same craft, now faster and at scale with AI. I load the full brand into Claude and have it find what's consistent: logos, fonts, colour, image and video style, spacing, icons and illustration. People decide and curate the results, and every colour pair is checked for WCAG contrast. Then the approved set goes back into Claude as tokens for all future design. With that system, La Palabra shipped a 30-day social campaign of over 240 posts in two weeks." },
  { c: "Problem-solving", q: "Checkout abandonment went from 62 to 70 percent the week after a payments update. Walk me through your first 48 hours.",
    read: "broken", concept: "Three checks, roll back fast, then test the fix safely.", proof: "The jump started the week of the payments update.",
    how: ["Check the drop is real, find where people leave, and go through checkout yourself on a phone.", "Roll back the same day.", "Fix one change at a time: 5% of traffic as a safety check, then a 50/50 test."],
    result: "Sales stop leaking, and the fix is proven before it goes to everyone.",
    say: "First, three checks. Reality: is the drop real, or did tracking break when the update went in? Data: break it down by device, payment method and browser to find the exact step where people drop off. Live: go through checkout myself on a phone. If the drop is real, I roll checkout back the same day, so we stop losing sales. By day 2, the fix goes to 5% of traffic for 24 hours as a safety check, then a 50/50 test until it's significant." },
  { c: "Problem-solving", q: "You can fund one thing this quarter: new product photography, a reviews redesign, or a faster checkout. Which one, and why?",
    concept: "Faster checkout.", proof: "Every buyer goes through checkout. At PayPal, cutting to one action took clicks from 17% to 54%.",
    how: ["Remove steps.", "Make it work first, polish second.", "Then fund photography and reviews."],
    result: "Conversion goes up for every customer, not just one group.",
    say: "Faster checkout. Every buyer goes through it, so each step we remove lifts conversion for everyone, not just one segment. Must-work first, polish second. Once checkout is fast, photography and reviews help more people reach it." },
  { c: "Working principles", q: "The VP wants a launch on Friday. Your team says the quality isn't there yet. What do you do?",
    read: "trade", concept: "Cut scope, not quality.", proof: "Delivered 4 books on time with zero delays.",
    how: ["Sort the work into must-work and polish with the team.", "Protect the quality floor: checkout works, accessibility passes, tracking fires.", "Recommend to the VP: must-work scope Friday, polish on a set date."],
    result: "You launch on time without breaking anything.",
    say: "I meet the team the same day and sort everything into must-work and polish. I set up a shared tracker with AI, so every task has an owner and a deadline, and I give the VP access to it. Then I go to the VP with a recommendation: launch the must-work scope Friday, ship the polish by a set date, and never cut the quality floor: checkout works, accessibility passes, tracking fires, nothing is broken." },
  { c: "Working principles", q: "Concretely, how does AI change your design process day to day? Which tools at which step, and where does a human decide?",
    concept: "AI does the volume. I make the calls.", proof: "Built a 12-style type system in Figma with Claude's help.",
    how: ["Brief: Claude drafts.", "Direction: Midjourney explores, and I coach the AI the way I'd coach an art director.", "Make and test: Figma, Weavy, Descript, and Claude prototypes."],
    result: "Faster work, and a person still decides the brief, the direction and what ships.",
    say: "Claude or ChatGPT drafts the brief and content, and Claude agents handle admin and meeting notes. ChatGPT and Midjourney explore styles fast, and I coach the AI the way I'd coach an art director until the style is right. Final design lives in Figma, Weavy refines images and video, and Descript handles quick edits. I test designs live with Claude prototypes before they go to development. A person decides three things: what the brief really asks for, which direction fits the brand, and what ships." },
  { c: "Working principles", q: "Tell me about a call you got wrong. What did you change afterwards?",
    concept: "Outcomes over tasks.", proof: "Tracked 300+ tasks, and it turned into micromanaging.",
    how: ["Stopped the task checklist.", "Gave each team one outcome to own.", "Let teams decide how to get there."],
    result: "Adoption went up and deadlines were met without extra oversight.",
    say: "Early in the publisher rebuild, I mapped every task, more than 300 of them, and tracked teams against that checklist. It turned into micromanagement, and people resisted the system. So we stopped and switched to outcomes: each team owned a result, and how they got there was up to them. Adoption went up, and deadlines were met without extra oversight." },
  { c: "Working principles", q: "A designer used AI to create new mattress product images. Conversion rose 6 percent, but two weeks later returns are rising and customers say the mattress doesn't look like the photos. What do you do?",
    read: "broken", concept: "Revert and tighten. A sale that comes back isn't a sale.", proof: "Pickup truck spot: AI got the grille and trim wrong, and we rebuilt it from real photos.",
    how: ["Revert to the real photos today, and track returns against the old baseline.", "Rebuild from multiple real photos: a 3D view in Weavy, then a realism pass.", "New rule: no AI product image ships until someone checks it against the real product."],
    result: "Returns fall back to normal, you keep a conversion lift that's honest, and customers trust what they see.",
    say: "Revert and tighten, because a sale that comes back isn't a sale. I'd put the real photos back today and track returns against the old baseline. On a pickup truck spot, AI got the grille and trim wrong, so we rebuilt it from multiple real photos, using a 3D view in Weavy and then a realism pass. I'd do the same here, with one new rule: no AI product image ships until someone checks it against the real product." },
  { c: "Role knowledge", q: "After we removed the bundle upsell from the PDP, CVR went up 4 percent but AOV dropped 7 percent. Leadership wants the upsell back. What do you recommend?",
    read: "trade", concept: "Don't choose. Keep the extra buyers and win back the order value.", proof: "1.04 × 0.93 ≈ 0.97: revenue per visitor is down about 3%.",
    how: ["Confirm the numbers over two full weeks.", "Move the upsell off the product page to after Add to Cart.", "Test 50/50 against the current page, judged on revenue per visitor."],
    result: "More buyers and bigger orders, and leadership gets the revenue back.",
    say: "It's a trade-off: more people buy, but each spends less. Multiplied together, revenue per visitor is down about 3%, so leadership has a point, but a full rollback throws away the extra buyers. I'd confirm over two full weeks, move the upsell to after Add to Cart so it doesn't get in the way of the decision, and test that 50/50 on revenue per visitor." },
];

export const TERMS: [string, [string, string][]][] = [
  ["Money", [
    ["CVR", "Conversion rate. The % of visitors who buy."],
    ["AOV", "Average order value. What each order spends."],
    ["RPV", "Revenue per visitor. CVR × AOV. The tiebreaker when those two fight."],
    ["LTV", "Lifetime value. What a customer spends over time."],
    ["CAC", "Customer acquisition cost. What it costs to win one customer."],
    ["ROAS", "Return on ad spend. Revenue for every dollar spent on ads."],
    ["DTC", "Direct to consumer. The brand sells straight to customers, like Puffy."],
    ["CRO", "Conversion rate optimization. Testing and design work to raise CVR."],
    ["KPI", "Key performance indicator. The number a team is judged on."]]],
  ["Pages and clicks", [
    ["PDP", "Product detail page. The mattress page itself."],
    ["PLP", "Product listing page. The category page."],
    ["ATC", "Add to cart."],
    ["CTA", "Call to action. The button."],
    ["CTR", "Click-through rate. The % of people who click."],
    ["UGC", "User-generated content. Customer photos and reviews."],
    ["Funnel", "The steps from visit to purchase. Drop-off is where people leave."],
    ["Abandonment", "People who start checkout or a cart and leave without buying."]]],
  ["Testing", [
    ["A/B test", "Show two versions to different visitors and compare the results."],
    ["p-value", "If there were no real difference, how often you'd see a result this big. Below 0.05 counts as significant."],
    ["Stat sig", "Statistically significant. Usually p below 0.05, after the full planned test."],
    ["Sample size", "How many visitors each version needs. Set it before the test starts."],
    ["MDE", "Minimum detectable effect. The smallest lift worth detecting."],
    ["Guardrail", "A number you watch so a win doesn't break something else, like returns."],
    ["Peeking", "Stopping a test early because it looks good. Avoid it."]]],
  ["Speed and accessibility", [
    ["LCP", "Largest contentful paint. How fast the main image loads. Aim for 2.5 seconds or less."],
    ["CLS", "Cumulative layout shift. The page jumping around as it loads. Aim for 0.1 or less."],
    ["INP", "Interaction to next paint. How fast the page responds to a tap. Aim for 200 ms or less."],
    ["Core Web Vitals", "Google's page experience scores: LCP, CLS and INP."],
    ["WCAG AA", "The accessibility standard. 4.5:1 contrast for text, 3:1 for large text and graphics."],
    ["Target size", "WCAG 2.2: tap targets at least 24 by 24 pixels."]]],
  ["Design systems", [
    ["Tokens", "Named values for colour, type and spacing that every design uses."],
    ["Components", "Reusable building blocks: buttons, cards, navigation."],
    ["Variables", "Figma's way of storing tokens so designs update in one place."]]],
];

// [number, what it proves, still unconfirmed?]
export const PROOFS: [string, string, boolean?][] = [
  ["26 years", "In marketing, advertising and creative operations."],
  ["17% → 54%", "PayPal email click-through, after cutting each email to one idea and one action."],
  ["3 years", "Running A/B tests on email and landing pages."],
  ["360 days → 16 weeks", "A publisher's process, from signed contract to shipped book."],
  ["20 people", "The publisher team you led."],
  ["4 books on time", "With zero delays."],
  ["300+ tasks", "Replaced with outcomes. Your Q10 story."],
  ["2.2:1", "Ghost buttons that failed contrast, caught in the Sustaining Leadership AI audit, along with a wrong hex code."],
  ["240+ posts", "La Palabra's 30-day social campaign, shipped in two weeks."],
  ["12 type styles", "Built in Figma with Claude."],
  ["Pickup truck spot", "AI spot: rebuilt from real photos after AI got the grille and trim wrong."],
  ["Since 2017", "Working to WCAG. WCAG 2.2 today."],
  ["Zavida", "Checkout pages, up to 2016."],
  ["63 or 65?", "Outcomes figure. Don't use it until it's settled.", true],
];

export const CHECK_PART1 = [
  "Finish both parts within 2 business days of the Oct 2 email. Aim for Monday.",
  "Laptop, Chrome, webcam on, quiet room, water within reach.",
  "Close every other tab and app, including this page.",
  "Check the link goes to adaface.com or puffy.com before you click.",
  "About 2 minutes a question. Don't get stuck on one.",
  "Broken or trade-off? Then Concept, Proof, How, Result.",
  "Unknown term: guess it out loud, then read which way the numbers moved.",
];

export const CHECK_PART2 = [
  "Open a chat with Santiago before you start the timer.",
  "Spend 5 minutes reading the brief. Find the one goal.",
  "Write your answer as Concept, Proof, How, Result.",
  "Leave 5 minutes to export and upload the one-page PDF or Word file.",
  "The reasoning and final decisions are yours. Say so in the document.",
];

export const TIPS: [string, string][] = [
  ["Lead with the answer.", "They decide in the first sentence whether you know the material."],
  ["One number per answer.", "Your best answers had one clear number and nothing extra."],
  ["Stop at the result.", "Every point you lost came after the result, never before it."],
  ["Never say \"I don't know.\"", "Say your first move: \"First, I'd check whether the data is real.\""],
  ["Unknown term? Guess out loud.", "\"If AOV means order value, then…\" Then read which way the numbers moved."],
  ["The four goals.", "Conversion, customer, quality, speed. Most questions are one of these, or two of them pulling against each other."],
  ["Watch your crutches.", "Roll back only when something is broken. Mention the AI tracker app once, not in every answer."],
  ["Multiple choice.", "Rule out the extremes. Pick the option that is data-driven, customer-first and takes ownership."],
];
