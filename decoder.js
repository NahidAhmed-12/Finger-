/**
 * Advanced Content Decoder
 * Scans the entire document for text nodes and replaces encoded strings.
 * This file must be hosted on your server to act as a CDN link.
 */
document.addEventListener('DOMContentLoaded', () => {
    const currentDomain = window.location.hostname;
    
    // নির্দিষ্ট প্যাটার্ন খোঁজার জন্য একটি রেগুলার এক্সপ্রেশন
    const regex = /ENC\[([a-zA-Z0-9+/=]+)\]/g;

    // পুরো ডকুমেন্টের টেক্সট খুঁজে বের করার জন্য একটি TreeWalker তৈরি করা হচ্ছে
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

    let node;
    const nodesToProcess = [];

    // প্রথমে সব টেক্সট নোড একটি অ্যারে-তে সংগ্রহ করা হচ্ছে
    while (node = walker.nextNode()) {
        if (node.nodeValue.includes('ENC[')) {
            nodesToProcess.push(node);
        }
    }

    // সংগ্রহ করা নোডগুলো প্রসেস করা হচ্ছে
    nodesToProcess.forEach(textNode => {
        let match;
        let lastIndex = 0;
        const newNodes = [];
        const originalText = textNode.nodeValue;
        
        // প্রতিটি এনকোডেড স্ট্রিং খুঁজে বের করা হচ্ছে
        while ((match = regex.exec(originalText)) !== null) {
            
            // এনকোডেড অংশের আগের সাধারণ টেক্সট যোগ করা হচ্ছে
            if (match.index > lastIndex) {
                newNodes.push(document.createTextNode(originalText.substring(lastIndex, match.index)));
            }

            try {
                const base64Content = match[1];
                // Base64 থেকে মূল JSON ডেটা ডিকোড করা হচ্ছে
                const decodedJson = decodeURIComponent(escape(atob(base64Content)));
                const data = JSON.parse(decodedJson);

                // *** ডোমেইন যাচাই ***
                if (data.domain === currentDomain) {
                    // ডোমেইন মিললে কনটেন্ট দেখানোর জন্য একটি span তৈরি করা হচ্ছে
                    const contentSpan = document.createElement('span');
                    contentSpan.innerHTML = data.content;
                    // span-এর ভেতরের নোডগুলো সরাসরি যুক্ত করা হচ্ছে
                    newNodes.push(...Array.from(contentSpan.childNodes));
                } else {
                    // ডোমেইন না মিললে কিছুই দেখানো হবে না
                    console.warn(`Content blocked for domain: ${currentDomain}. Required: ${data.domain}`);
                }
            } catch (e) {
                console.error("Failed to decode content.", e);
            }
            lastIndex = regex.lastIndex;
        }

        // এনকোডেড অংশের পরের সাধারণ টেক্সট যোগ করা হচ্ছে
        if (lastIndex < originalText.length) {
            newNodes.push(document.createTextNode(originalText.substring(lastIndex)));
        }

        // মূল টেক্সট নোডটিকে নতুন নোডগুলো দিয়ে প্রতিস্থাপন করা হচ্ছে
        if (newNodes.length > 0) {
            textNode.replaceWith(...newNodes);
        }
    });
});
