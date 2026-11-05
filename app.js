"use strict";
const $ = id => document.getElementById(id);
const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
  "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
}[ch]));
const STORAGE_KEY = "mohsenSalesOS.hotels.v1";
let hotels = [];
try { hotels = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch (_) { hotels = []; }
let lastEmail = "";

function showToast(message) {
  const el = $("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  window.setTimeout(() => el.classList.remove("show"), 2200);
}
function navigate(pageId) {
  document.querySelectorAll(".page").forEach(el => el.classList.toggle("active", el.id === pageId));
  document.querySelectorAll(".nav").forEach(el => el.classList.toggle("active", el.dataset.page === pageId));
  const titles = {overview:"Overview",copilot:"Renewal Copilot",discovery:"Discovery Builder",comparator:"Product Comparator",followup:"Follow-up Writer",tracker:"Renewal Tracker"};
  $("pageTitle").textContent = titles[pageId] || "Overview";
  window.scrollTo({top:0, behavior:"smooth"});
}
document.querySelectorAll("[data-page]").forEach(el => el.addEventListener("click", () => navigate(el.dataset.page)));
document.querySelectorAll("[data-goto]").forEach(el => el.addEventListener("click", () => navigate(el.dataset.goto)));

function setOutput(id, html) {
  const el = $(id);
  el.classList.remove("empty");
  el.innerHTML = html;
}
function copyOutput(id) {
  const text = $(id).innerText || "";
  if (!text.trim()) return showToast("Nothing to copy yet");
  if (!navigator.clipboard) return showToast("Clipboard is unavailable in this browser");
  navigator.clipboard.writeText(text).then(() => showToast("Copied to clipboard")).catch(() => showToast("Clipboard permission was blocked"));
}
document.querySelectorAll("[data-copy]").forEach(el => el.addEventListener("click", () => copyOutput(el.dataset.copy)));

const makeQ = (question, uncover, signal, bridge) => ({question,uncover,signal,bridge});
const discoveryData = {
  direct:{label:"Direct booking opportunity",questions:[
    makeQ("“How would you describe the balance between direct bookings and third-party channels today?”","Understand channel mix and the hotel's preferred distribution strategy.","High intermediary reliance or an explicit direct-channel growth target.","Review Tripadvisor referral actions as one part of the hotel's wider acquisition mix."),
    makeQ("“When guests click through to your website or call, how do you identify what happens next?”","Understand tracking and conversion.","Referral actions are not connected to reservation records.","Separate observed activity from confirmed reservations and agree a tracking method."),
    makeQ("“What would need to change for direct bookings to become a stronger part of your mix?”","Identify the real obstacle: awareness, rate parity, website, availability or follow-up.","A specific obstacle the hotel can act on.","Connect verified Business Advantage benefits only to the discovery or engagement part they can support.")
  ]},
  ota:{label:"OTA dependency",questions:[
    makeQ("“What role do your OTA partners play in your distribution strategy?”","Understand why the hotel values those channels.","Channel concentration or cost concern.","Position Tripadvisor as potentially complementary, not a replacement."),
    makeQ("“What would a healthier channel mix look like for the property?”","Understand goals and constraints.","Desire for channel diversity or stronger direct relationships.","Compare channel roles using hotel-owned cost and performance data."),
    makeQ("“How do you measure each channel beyond booking volume?”","Understand net contribution and acquisition cost.","Decisions based only on gross volume.","Use verified Tripadvisor actions and hotel data without assuming attribution.")
  ]},
  traffic:{label:"Website traffic",questions:[
    makeQ("“Where does your website traffic come from today?”","Understand traffic mix.","Dependence on a small number of sources.","Check Tripadvisor website-click reporting for the same period."),
    makeQ("“Once visitors reach your website, what do you know about their next step?”","Understand conversion tracking.","Clicks but weak booking completion.","Identify post-click friction without attributing website conversion to Tripadvisor."),
    makeQ("“Which audience or travel dates are you trying to attract?”","Clarify target segment and timing.","Unfocused acquisition activity.","Review whether the listing accurately communicates the hotel's proposition.")
  ]},
  roi:{label:"Marketing measurement",questions:[
    makeQ("“How do you decide whether a marketing channel is paying off?”","Understand the measurement framework.","No consistent cost-to-outcome comparison.","Agree on a common basis for assessing the subscription."),
    makeQ("“Which actions can you reliably connect to an actual reservation?”","Test attribution quality.","Clicks or calls are mistaken for bookings, or source data is missing.","Keep engagement and bookings separate; agree on a source-capture process."),
    makeQ("“What evidence would make you confident the investment is worthwhile?”","Define decision criteria.","No agreed renewal success measures.","Build the next-period review around realistic criteria.")
  ]},
  seasonal:{label:"Seasonality and occupancy",questions:[
    makeQ("“Which months or booking windows are most difficult for the property?”","Understand demand patterns.","Specific periods of weak occupancy.","Explore whether the Tripadvisor audience and listing information fit those dates."),
    makeQ("“What have you tried during those periods?”","Understand previous action and results.","Limited channel mix or ineffective campaigns.","Evaluate channels on evidence; do not promise subscription-driven demand."),
    makeQ("“What would a successful low-season period look like?”","Set realistic targets.","Clear business goal.","Connect discovery activity to the goal only when supported.")
  ]},
  price:{label:"Marketing budget pressure",questions:[
    makeQ("“How are you deciding which marketing investments to keep or reduce?”","Understand the budget framework.","Cost-cutting mandate.","Use consistent criteria across channels."),
    makeQ("“Is the concern the renewal price, timing, or the value you're receiving?”","Clarify the real objection.","Budget limit, price shock or value gap.","Respond to the real issue and verify commercial terms internally."),
    makeQ("“What result would justify keeping this in the budget?”","Understand the value threshold.","Explicit success condition.","Compare the threshold with verified data; never guarantee ROI.")
  ]},
  competition:{label:"Competitive pressure",questions:[
    makeQ("“Which properties do you see as your closest competitors, and why?”","Understand the competitive set.","Price, location, reputation or positioning challenge.","Avoid unsupported ranking comparisons."),
    makeQ("“What makes guests choose those hotels over yours?”","Find the differentiation gap.","Offer, content, service, pricing or availability issue.","Check whether the listing expresses genuine hotel strengths."),
    makeQ("“What would you want a traveler comparing properties to notice about your hotel?”","Identify the positioning priority.","Unclear value proposition.","Tie listing presentation to authentic strengths and confirmed plan capabilities.")
  ]},
  usage:{label:"Low feature adoption",questions:[
    makeQ("“Which parts of your current Business Advantage subscription have you used most?”","Understand usage.","Low adoption or a valued benefit.","Review exact plan inclusions and feature-level value."),
    makeQ("“What has made it difficult to use the other features?”","Find a training, time, ownership or relevance gap.","Lack of awareness or workflow friction.","Offer approved guidance; do not claim features that are not on the account."),
    makeQ("“If we made one part easier to use, which would matter most?”","Prioritize enablement.","One adoption opportunity.","Agree on a practical usage action and review date.")
  ]},
  value:{label:"Unclear Tripadvisor value",questions:[
    makeQ("“What did you expect Tripadvisor to contribute when you first subscribed?”","Surface original expectations.","Expectation and product-role mismatch.","Reset expectations using current plan facts and measured activity."),
    makeQ("“What have you actually noticed in the account or heard from guests?”","Understand evidence and perception.","Low awareness or performance.","Review reporting and distinguish engagement from bookings."),
    makeQ("“What would you need to see to make renewal a sound business decision?”","Set decision criteria.","Unresolved value concern.","Agree on measurable criteria and transparent follow-up.")
  ]},
  response:{label:"Enquiry conversion",questions:[
    makeQ("“When a traveler calls or visits your website, what happens next?”","Map the response journey.","Missed calls, slow responses or unclear booking route.","The subscription may create an opportunity; hotel operations determine what happens next."),
    makeQ("“How quickly does the team typically respond to enquiries?”","Understand response-time process.","Operational leakage.","Recommend operational improvement separately from product value."),
    makeQ("“How do you record whether an enquiry became a reservation?”","Understand tracking.","No conversion visibility.","Set a source and outcome recording approach.")
  ]}
};

function questionCards(data) {
  return data.questions.map((item,index) =>
    "<div class='question-card'><b>" + (index+1) + ". " + esc(item.question) + "</b>" +
    "<small><strong>Uncover:</strong> " + esc(item.uncover) + "</small>" +
    "<small><strong>Listen for:</strong> " + esc(item.signal) + "</small>" +
    "<small><strong>Value bridge:</strong> " + esc(item.bridge) + "</small></div>"
  ).join("");
}

$("buildDiscovery").addEventListener("click", () => {
  const data = discoveryData[$("disChallenge").value];
  setOutput("discoveryOutput",
    "<div class='eyebrow green'>" + esc(data.label.toUpperCase()) + " · " + esc($("disRole").value.toUpperCase()) + "</div>" +
    "<h3>Suggested discovery sequence</h3><p>Stage: <b>" + esc($("disStage").value) + "</b>. Ask one question, listen, then choose the next based on the answer.</p>" +
    questionCards(data) +
    "<h4>Root-cause follow-ups</h4><ul><li>“Can you walk me through the last time that happened?”</li><li>“How often does it happen, and how do you measure it?”</li><li>“What have you already tried?”</li><li>“What happens if this stays the same for another six months?”</li><li>“What evidence would give you confidence it's improving?”</li></ul>" +
    "<h4>Renewal transition</h4><p>“Based on what you've shared, your priority is [goal] and the main challenge is [root cause]. Would it be useful to review what your current Business Advantage plan can—and cannot—support?”</p>"
  );
});

$("buildCopilot").addEventListener("click", () => {
  const hotel = $("coHotel").value.trim() || "the hotel";
  const concernMap = {direct:"direct",roi:"roi",price:"price",ota:"ota",seasonal:"seasonal",usage:"usage",competition:"competition",cancel:"value",unknown:"value"};
  const data = discoveryData[concernMap[$("coConcern").value]];
  const goal = $("coGoal").value.trim() || "Not established";
  const evidence = $("coEvidence").value.trim() || "No verified evidence entered";
  const notes = $("coNotes").value.trim() || "No additional notes";
  setOutput("copilotOutput",
    "<div class='eyebrow green'>CALL PLAN · " + esc(hotel.toUpperCase()) + "</div>" +
    "<h3>1. Opening and agenda</h3><p>“Thanks for making time today. I'd like to understand the hotel's current priorities, review the Tripadvisor activity we can verify, and then see whether the current Business Advantage subscription still makes sense. Does that work for you?”</p>" +
    "<h4>2. Account context</h4><ul><li><b>Property:</b> " + esc(hotel) + " · " + esc($("coType").value) + "</li><li><b>Contact:</b> " + esc($("coRole").value) + "</li><li><b>Concern:</b> " + esc(data.label) + "</li><li><b>Customer goal:</b> " + esc(goal) + "</li><li><b>Verified evidence:</b> " + esc(evidence) + "</li><li><b>Notes:</b> " + esc(notes) + "</li></ul>" +
    "<h4>3. Discovery path</h4>" + questionCards(data) +
    "<h4>4. Evidence-led value summary</h4><p>“Your priority is [goal], and the main challenge is [pain point]. The account evidence shows [verified activity]. That tells us about engagement, but it does not by itself confirm bookings or revenue. Let's compare it with your reservation and enquiry records.”</p>" +
    "<h4>5. Renewal bridge</h4><p>“If the confirmed benefits in your current plan support the priority we've discussed, and the investment fits the hotel's criteria, would you be open to reviewing the renewal together?”</p>" +
    "<h4>6. Before commitment</h4><ul><li>Confirm BA inclusions and eligibility in approved documentation.</li><li>Confirm renewal price, term, billing and deadline in the authorized system.</li><li>Identify the decision maker and approval process.</li><li>Agree on success measures and next step.</li></ul><p><b>Never claim:</b> guaranteed ranking improvement, bookings, ROI or unverified features.</p>"
  );
});

const products = {
  ba:["Business Advantage","Paid subscription benefits for the Tripadvisor hotel business listing, as specified in the property's current contract and market plan.","Discuss verified inclusions, usage and observable account engagement.","Confirm feature set, term, renewal price, eligibility, market availability and reporting."],
  free:["Free Tripadvisor listing","The hotel's free presence on Tripadvisor; it is not the same as a paid subscription.","Acknowledge the free presence, then compare it with paid benefits actually included in this account.","Confirm current free-listing capabilities and any differences from this plan."],
  sp:["Sponsored Placements","A separate paid advertising or sponsored-visibility product category.","Treat as a distinct product conversation and route interest through the approved internal process.","Confirm eligibility, campaign setup, targeting, placement, pricing, reporting and ownership."],
  meta:["Meta / metasearch","A hotel price-comparison and advertising distribution category; setup and commercial details vary.","Understand whether the hotel is interested in rate comparison or metasearch distribution, then route appropriately.","Confirm supported partners, connectivity, eligibility, commercial model and responsible team."],
  dbm:["Direct Book Max","A separate product name requiring current internal product documentation for accurate positioning.","Do not improvise a product pitch. Confirm the need and route to the right internal owner.","Confirm product definition, availability, eligibility, pricing, ownership and relation to BA."]
};
$("compareProducts").addEventListener("click", () => {
  const selected = Array.from($("cmpProducts").selectedOptions).map(option => option.value);
  if (!selected.length) return showToast("Select at least one product");
  const needs = {direct:"The hotel wants more direct-channel opportunities.",visibility:"The hotel wants travelers to discover the property.",profile:"The hotel wants its listing to represent the property accurately.",ads:"The hotel is asking about paid campaign exposure.",measure:"The hotel wants to understand performance."};
  setOutput("compareOutput",
    "<div class='eyebrow green'>POSITIONING GUIDE</div><h3>" + esc(needs[$("cmpNeed").value]) + "</h3><p>Start with the hotel need, not a feature list. These categories are not interchangeable.</p>" +
    selected.map(key => {
      const item=products[key];
      return "<div class='question-card'><b>" + esc(item[0]) + "</b><p>" + esc(item[1]) + "</p><small><strong>Conversation approach:</strong> " + esc(item[2]) + "</small><small><strong>Confirm before claiming:</strong> " + esc(item[3]) + "</small></div>";
    }).join("") +
    "<h4>Suggested transition</h4><p>“Based on what you've described, your priority is [need]. I'll confirm the current details and, where needed, connect you with the team responsible for that product.”</p>"
  );
});

const emailPurposes = {
  recap:["Recap and next steps","Thank you for taking the time to speak with me today. I appreciated learning more about the hotel's current priorities."],
  meeting:["Confirming our meeting","Thank you for arranging time to connect. I look forward to reviewing the hotel's Tripadvisor performance and renewal considerations."],
  data:["Tripadvisor performance review","As discussed, I've summarized the account activity we reviewed so we can consider it alongside the hotel's own enquiry and reservation records."],
  objection:["Following up on your questions","Thank you for being candid about your concerns. I understand that the renewal decision needs to make sense for the hotel's business and budget."],
  renewal:["Business Advantage renewal discussion","I'm following up regarding the hotel's upcoming Business Advantage renewal so you have time to review the relevant details and make an informed decision."],
  decision:["Renewal review and decision-makers","Thank you for discussing the hotel's priorities with me. I wanted to share a concise recap to help everyone involved evaluate the renewal."]
};
$("writeFollowup").addEventListener("click", () => {
  const purpose = emailPurposes[$("fuPurpose").value];
  const name=$("fuName").value.trim(), hotel=$("fuHotel").value.trim() || "the hotel";
  const facts=$("fuFacts").value.trim(), priority=$("fuPriority").value.trim(), next=$("fuNext").value.trim();
  let intro=purpose[1];
  if ($("fuTone").value==="concise") intro="Thank you for your time today. Here's a brief recap of our discussion.";
  if ($("fuTone").value==="consultative") intro="Thank you for the conversation today. I appreciated the opportunity to understand the hotel's priorities and what matters most in evaluating the next term.";
  const greeting=name ? "Hello " + name + "," : "Hello,";
  lastEmail = "Subject: " + purpose[0] + "\n\n" + greeting + "\n\n" + intro + "\n\nHotel: " + hotel + "\n" +
    (priority ? "Priority discussed: " + priority + "\n" : "") +
    (facts ? "Account information reviewed: " + facts + "\n" : "") +
    (next ? "Agreed next step: " + next + "\n" : "") +
    "\nPlease let me know if I've missed anything or if you'd like me to clarify any part of the summary.\n\nBest regards,\nMohamed Mohsen\nAccount Manager";
  setOutput("followupOutput",
    "<div class='question-card'><b>Subject:</b> " + esc(purpose[0]) + "</div><p>" + esc(greeting) + "</p><p>" + esc(intro) + "</p>" +
    (priority ? "<p><b>Hotel priority:</b> " + esc(priority) + "</p>" : "") +
    (facts ? "<p><b>Account information reviewed:</b><br>" + esc(facts).replace(/\n/g,"<br>") + "</p>" : "") +
    (next ? "<p><b>Agreed next step:</b><br>" + esc(next).replace(/\n/g,"<br>") + "</p>" : "") +
    "<p>Please let me know if I have missed anything or if you would like me to clarify any part of the summary.</p><p>Best regards,<br>Mohamed Mohsen<br>Account Manager</p>"
  );
});

function downloadFile(filename, content, mime) {
  const url=URL.createObjectURL(new Blob([content],{type:mime || "text/plain;charset=utf-8"}));
  const link=document.createElement("a");
  link.href=url; link.download=filename; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$("downloadEmail").addEventListener("click", () => lastEmail ? downloadFile("hotel-follow-up.txt",lastEmail) : showToast("Write an email first"));

function clearTrackerForm() {
  $("hotelForm").reset(); $("editId").value=""; $("trackerFormTitle").textContent="Add hotel renewal";
}
function renderTracker() {
  const search=$("trackerSearch").value.toLowerCase();
  const rows=hotels.filter(item=>item.hotel.toLowerCase().includes(search)).sort((a,b)=>(a.date||"9999").localeCompare(b.date||"9999"));
  $("trackerRows").innerHTML=rows.length ? rows.map(item =>
    "<tr><td><b>" + esc(item.hotel) + "</b><br><small>" + esc(item.concern || "No concern entered") + "</small></td><td>" + esc(item.date || "—") +
    "</td><td>" + esc(item.status) + "</td><td><span class='pill " + (item.risk==="High"?"high":item.risk==="Medium"?"medium":"") + "'>" + esc(item.risk) +
    "</span></td><td>" + esc(item.nextDate || "—") + "</td><td><button data-edit='" + esc(item.id) + "'>Edit</button><button data-delete='" + esc(item.id) + "'>Delete</button></td></tr>"
  ).join("") : "<tr><td colspan='6' class='empty-cell'>No hotels added yet.</td></tr>";
  const today=new Date(); today.setHours(0,0,0,0);
  const end=new Date(today); end.setDate(end.getDate()+30);
  $("statHotels").textContent=hotels.length;
  $("statUpcoming").textContent=hotels.filter(x=>x.date && new Date(x.date+"T00:00:00")>=today && new Date(x.date+"T00:00:00")<=end && !["Renewed","Not renewing"].includes(x.status)).length;
  $("statDue").textContent=hotels.filter(x=>x.nextDate && new Date(x.nextDate+"T00:00:00")<=today && !["Renewed","Not renewing"].includes(x.status)).length;
  $("statRenewed").textContent=hotels.filter(x=>x.status==="Renewed").length;
}
function persistHotels() {
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(hotels)); renderTracker(); }
  catch (_) { showToast("Browser storage is full or unavailable"); }
}
$("hotelForm").addEventListener("submit", event => {
  event.preventDefault();
  const id=$("editId").value || (window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
  const record={id,hotel:$("trHotel").value.trim(),date:$("trDate").value,status:$("trStatus").value,risk:$("trRisk").value,concern:$("trConcern").value.trim(),nextDate:$("trNextDate").value,notes:$("trNotes").value.trim()};
  const index=hotels.findIndex(item=>item.id===id);
  if(index<0) hotels.push(record); else hotels[index]=record;
  persistHotels(); clearTrackerForm(); showToast("Hotel saved in this browser");
});
$("cancelEdit").addEventListener("click",clearTrackerForm);
$("trackerSearch").addEventListener("input",renderTracker);
$("trackerRows").addEventListener("click",event => {
  const editId=event.target.dataset.edit, deleteId=event.target.dataset.delete;
  if(editId) {
    const item=hotels.find(x=>x.id===editId); if(!item) return;
    $("editId").value=item.id; $("trHotel").value=item.hotel; $("trDate").value=item.date; $("trStatus").value=item.status;
    $("trRisk").value=item.risk; $("trConcern").value=item.concern; $("trNextDate").value=item.nextDate; $("trNotes").value=item.notes;
    $("trackerFormTitle").textContent="Edit hotel renewal"; window.scrollTo({top:0,behavior:"smooth"});
  }
  if(deleteId && window.confirm("Delete this hotel record from this browser?")) {
    hotels=hotels.filter(x=>x.id!==deleteId); persistHotels(); showToast("Record deleted");
  }
});
const csvCell=value => '"' + String(value ?? "").replace(/"/g,'""') + '"';
$("exportTracker").addEventListener("click",() => {
  const rows=[["Hotel","Renewal date","Status","Risk","Primary concern","Next action date","Notes"],...hotels.map(x=>[x.hotel,x.date,x.status,x.risk,x.concern,x.nextDate,x.notes])];
  downloadFile("hotel-renewal-tracker.csv",rows.map(row=>row.map(csvCell).join(",")).join("\r\n"),"text/csv;charset=utf-8");
});
$("exportAll").addEventListener("click",() => downloadFile("mohsen-sales-os-data.json",JSON.stringify({exportedAt:new Date().toISOString(),hotels},null,2),"application/json"));
renderTracker();
