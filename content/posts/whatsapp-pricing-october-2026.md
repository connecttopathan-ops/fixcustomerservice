---
title: WhatsApp pricing from 1 October 2026
description: From 1 October, Meta charges for customer service replies sent through the WhatsApp API. What changes, who pays, and what to do this week.
slug: whatsapp-pricing-october-2026
date: 2026-09-25
updated: 2026-09-25
tags: [whatsapp, cost]
readingMinutes: 6
image: blog/whatsapp-pricing-october-2026.jpg
---
From 1 October 2026, Meta charges for every customer service reply sent through the WhatsApp Business Platform (the API). Until now, those replies were free inside the 24-hour window after a customer messages you. If you use the free WhatsApp Business app on a phone, this change does not apply to you.

If you run support on the API, your WhatsApp bill is about to depend on how many replies your team and your chatbot send. That makes the way you reply a cost decision, not just a service one.

## What exactly changes

Here is the change in plain terms, taken from [Meta's own pricing notice](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages).

| Message type | Before 1 October | From 1 October |
| --- | --- | --- |
| Your replies inside the 24-hour window (free text, from a person or a bot) | Free | Charged per message |
| Utility templates sent inside the 24-hour window (order updates, confirmations) | Free | Charged per message |
| Messages inside the 72-hour window after a customer clicks your ad | Free | Still free |
| Marketing, utility and authentication templates outside the window | Charged | Charged, no change |

Meta says service replies cost the same as a utility message in the customer's country. Rates differ by country, and Meta can update them every quarter. You can check the rate for your markets on [Meta's pricing page](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing).

Some of Meta's partners, such as [SendPulse](https://sendpulse.com/blog/whatsapp-service-message-pricing) and [YCloud](https://www.ycloud.com/blog/whatsapp-api-message-pricing-update-effective-october-1-2026), report a free allowance. They say each business number gets 1,000 free service messages a month, with charges from the 1,001st. At the time of writing, that allowance is not on Meta's main pricing page, so confirm it with your provider.

## Who pays and who doesn't

**You are affected if** your support runs on a platform connected to the WhatsApp API. That covers most helpdesks, shared inboxes and chatbot tools that let several people answer one WhatsApp number.

**You are not affected if** you answer customers in the free WhatsApp Business app on a phone. The app has its own limits, which we cover in [WhatsApp Business app vs API](/blog/whatsapp-business-app-vs-api).

**Chatbots count too.** Meta's notice says the charge applies to replies from people and from third-party AI tools. Every "Please choose an option" message your bot sends is now a paid message.

## What it could cost you

The bill depends on two numbers: how many chats you handle, and how many replies each chat takes. The chart below uses an example rate of €0.03 per message and assumes four replies per chat, after the first 1,000 free messages. Your real rate depends on your customers' country.

<figure class="post-chart">
<svg viewBox="0 0 640 300" role="img" aria-label="Bar chart: estimated monthly WhatsApp cost at an example rate of 3 cents per message and 4 replies per chat. 500 chats a month costs about 30 euros, 1,000 chats about 90 euros, 3,000 chats about 330 euros, 10,000 chats about 1,170 euros." font-family="Schibsted Grotesk, system-ui, sans-serif">
  <line x1="60" y1="250" x2="620" y2="250" stroke="#E6DFD3"/>
  <line x1="60" y1="190" x2="620" y2="190" stroke="#EFEAE0"/>
  <line x1="60" y1="130" x2="620" y2="130" stroke="#EFEAE0"/>
  <line x1="60" y1="70" x2="620" y2="70" stroke="#EFEAE0"/>
  <text x="52" y="254" text-anchor="end" font-size="12" fill="#5F594F">€0</text>
  <text x="52" y="194" text-anchor="end" font-size="12" fill="#5F594F">€400</text>
  <text x="52" y="134" text-anchor="end" font-size="12" fill="#5F594F">€800</text>
  <text x="52" y="74" text-anchor="end" font-size="12" fill="#5F594F">€1,200</text>
  <rect x="95" y="245.5" width="80" height="4.5" fill="#0E6B58" rx="2"/>
  <rect x="230" y="236.5" width="80" height="13.5" fill="#0E6B58" rx="2"/>
  <rect x="365" y="200.5" width="80" height="49.5" fill="#0E6B58" rx="2"/>
  <rect x="500" y="74.5" width="80" height="175.5" fill="#0E6B58" rx="2"/>
  <text x="135" y="236" text-anchor="middle" font-size="14" font-weight="700" fill="#141310">€30</text>
  <text x="270" y="227" text-anchor="middle" font-size="14" font-weight="700" fill="#141310">€90</text>
  <text x="405" y="191" text-anchor="middle" font-size="14" font-weight="700" fill="#141310">€330</text>
  <text x="540" y="65" text-anchor="middle" font-size="14" font-weight="700" fill="#141310">€1,170</text>
  <text x="135" y="272" text-anchor="middle" font-size="13" fill="#141310">500 chats</text>
  <text x="270" y="272" text-anchor="middle" font-size="13" fill="#141310">1,000 chats</text>
  <text x="405" y="272" text-anchor="middle" font-size="13" fill="#141310">3,000 chats</text>
  <text x="540" y="272" text-anchor="middle" font-size="13" fill="#141310">10,000 chats</text>
  <text x="340" y="294" text-anchor="middle" font-size="12" fill="#5F594F">Chats per month</text>
  <text x="60" y="30" font-size="13" font-weight="700" fill="#141310">Estimated monthly cost of service replies</text>
</svg>
<figcaption>Example only: €0.03 per message, 4 replies per chat, first 1,000 messages free. Check your own rate on Meta's rate card.</figcaption>
</figure>

The number to watch is replies per chat. Cut it from four to three and the 3,000-chat business saves about €90 a month. Cut the number of chats and the saving grows further.

When we moved a payroll card business from email to WhatsApp, the channel grew to more than 30,000 chats a month. At that size, one extra "Is there anything else?" message per chat adds up to thousands of paid messages every month.

## Five things to do this week

1. **Check how you connect.** Ask your provider or your IT person one question: are we on the WhatsApp Business app or the API? If it is the app, you can stop here.
2. **Check your billing.** Make sure your Meta business account or your provider has a valid payment method. Replies that fail to send are worse than replies that cost money.
3. **Count your replies per chat.** Export last month's WhatsApp chats and divide messages sent by chats handled. Anything above four is worth a look.
4. **Merge small replies.** "Hi", "one moment please" and "let me check" can often be one message. Save quick replies that answer the whole question in one go.
5. **Shorten your bot.** Look at every step in your chatbot flow. If a step only says "Thanks, one moment", remove it.

## The bigger fix

Paying per reply puts a price on every message your customers should never have needed to send. "Where is my order?", "Did you get my payment?" and "Can I change my address?" are cheaper to prevent than to answer.

That is why we look at contact rate before reply speed. If you want the full picture of what each customer message costs you, start with [how to calculate cost per contact](/blog/how-to-calculate-cost-per-contact). It takes about twenty minutes with numbers you already have.

If you would like us to look at your WhatsApp setup with you, our [customer service audit](/customer-service-audit) covers message volumes, reply habits and bot flows.

## Frequently asked questions

### When do the new WhatsApp charges start?

On 1 October 2026. From that date, Meta charges per message for service replies and for utility templates sent inside the 24-hour customer service window.

### Does this affect the free WhatsApp Business app?

No. The change applies to the WhatsApp Business Platform, which businesses reach through the API or a provider. The free app on a phone is not part of it.

### Do chatbot replies count as paid messages?

Yes. Meta's notice says the charge applies to replies from people and from third-party AI tools.

### Are messages from Click to WhatsApp ads still free?

Yes. Messages inside the 72-hour free entry point window, which opens when a customer messages you from an ad or a Facebook Page button, stay free.

### How much does one service reply cost?

The same as a utility message in your customer's country. Rates vary by country and can change each quarter, so check Meta's rate card for your markets.

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
{"@type":"Question","name":"When do the new WhatsApp charges start?","acceptedAnswer":{"@type":"Answer","text":"On 1 October 2026. From that date, Meta charges per message for service replies and for utility templates sent inside the 24-hour customer service window."}},
{"@type":"Question","name":"Does this affect the free WhatsApp Business app?","acceptedAnswer":{"@type":"Answer","text":"No. The change applies to the WhatsApp Business Platform, which businesses reach through the API or a provider. The free app on a phone is not part of it."}},
{"@type":"Question","name":"Do chatbot replies count as paid messages?","acceptedAnswer":{"@type":"Answer","text":"Yes. Meta's notice says the charge applies to replies from people and from third-party AI tools."}},
{"@type":"Question","name":"Are messages from Click to WhatsApp ads still free?","acceptedAnswer":{"@type":"Answer","text":"Yes. Messages inside the 72-hour free entry point window, which opens when a customer messages you from an ad or a Facebook Page button, stay free."}},
{"@type":"Question","name":"How much does one service reply cost?","acceptedAnswer":{"@type":"Answer","text":"The same as a utility message in your customer's country. Rates vary by country and can change each quarter, so check Meta's rate card for your markets."}}
]}
</script>
