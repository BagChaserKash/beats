-- Version 2 license agreements (strengthened drafts; attorney review still recommended).
-- Adds new versions. Version 1 stays on file for earlier orders. Run once.

insert into public.license_template_versions (tier_id, version, terms, agreement_body, published_at)
select id, 2, '{"files": ["MP3"], "distribution_copies": 2500, "audio_streams": 100000, "music_videos": 1, "video_streams": 100000, "radio_stations": 0, "term_years": 3, "credit_required": true, "licensee_may_register_content_id": false, "producer_publishing_share_pct": 50, "governing_law": "South Carolina", "venue": "Richland County, South Carolina", "ai_training_prohibited": true, "standalone_instrumental_prohibited": true, "draft": true}'::jsonb, $body$MP3 LEASE AGREEMENT (NON-EXCLUSIVE)
Version 2

This agreement is between Pinnacle Forge Solutions LLC, doing business as BAGCHASERKASH ("Producer"), and {{licensee_name}} ({{licensee_email}}) ("Artist"). It covers the instrumental titled "{{beat_title}}" (the "Beat"), purchased under order {{order_number}} for a license fee of {{price}}. It takes effect on {{effective_date}}, but only once Producer has received the full license fee.

1. LICENSE GRANT
Producer grants Artist a non-exclusive, non-transferable license to record new vocals over the Beat to create one new song (the "Song") and to use the Song as described in this agreement. Producer keeps every right not expressly granted here.

2. FILES DELIVERED
One untagged MP3 file of the Beat.

3. USAGE LIMITS
Artist may:
(a) distribute or sell up to 2,500 copies of the Song, combining downloads and physical copies;
(b) earn up to 100,000 audio streams of the Song, combined across all streaming services;
(c) make 1 music video(s) for the Song, with up to 100,000 combined video views;
(d) not broadcast the Song on commercial radio (internet radio and podcasts that pay no licensing fees are fine);
(e) perform the Song live at for-profit and non-profit performances.
Artist may release the Song through digital distributors (such as DistroKid, TuneCore, or CD Baby) within these limits. Once any limit is reached, Artist must buy a new license before any further use of that kind.

4. TERM
This license lasts 3 years from the effective date. After that, Artist must renew the license to keep distributing the Song.

5. OWNERSHIP AND PUBLISHING
Producer owns and keeps the copyright in the Beat, including the sound recording and the underlying music. This agreement does not transfer any ownership of the Beat to Artist. Artist owns Artist's lyrics and vocal performance. For the musical composition of the Song, Producer keeps a 50% share of the writer's and publisher's share, and Artist must list Producer with that share when registering the Song with any performing rights organization, publishing administrator, or similar service.

6. CREDIT
Artist must credit the Beat as "Prod. BAGCHASERKASH" in song titles or descriptions, streaming and distributor metadata, video descriptions, and anywhere credits are normally given.

7. CONTENT ID AND REGISTRATIONS
Artist may not register the Beat or the Song with YouTube Content ID or any similar audio-fingerprinting system, directly or through a distributor, and must turn off any such option a distributor offers. If a claim by Producer affects Artist's licensed use, Producer will release it after Artist provides proof of this license.

8. RESTRICTIONS
Artist may not:
(a) resell, share, give away, sublicense, or transfer the Beat or its files;
(b) release the Beat as an instrumental, or with only minor additions, instead of as part of a Song with substantial new vocals;
(c) claim to have produced or own the Beat;
(d) use the Beat in film, television, advertising, video games, or other synchronization beyond the music videos allowed above without a separate license;
(e) use the Beat or the Song to train, fine-tune, or prompt any artificial intelligence or machine-learning system, or to generate new instrumentals based on the Beat; or
(f) use the Beat for anything unlawful, defamatory, or infringing.

9. NON-EXCLUSIVITY
Producer may continue to license the Beat to others, including on an exclusive basis. If the Beat is later licensed exclusively to someone else, this license stays valid under its own terms.

10. ARTIST'S PROMISES
Artist promises that Artist's lyrics, vocals, and anything else Artist adds to the Song are original or properly cleared, and do not infringe anyone's rights. Artist will cover Producer's losses, including reasonable attorney fees, from any claim caused by Artist's additions to the Song or by Artist's breach of this agreement.

11. PRODUCER'S PROMISES AND LIABILITY
Producer promises that the Beat is Producer's original work, contains no uncleared samples, and that Producer has the right to grant this license. Except for that promise, the Beat is provided as-is. Producer's total liability under this agreement is limited to the license fee Artist paid.

12. REFUNDS AND TERMINATION
Because files are delivered digitally, sales are final once files are downloaded, except where the law requires otherwise. This license ends automatically if the payment is refunded or reversed through a chargeback, or if Artist materially breaches this agreement and does not fix the breach within 14 days of written notice. After the license ends, any further use of the Beat is copyright infringement. Sections 5, 6, 7, 10, and 11 continue after this agreement ends.

13. GENERAL
This agreement is governed by the laws of the State of South Carolina, and any lawsuit about it must be brought in the state or federal courts serving Richland County, South Carolina. Artist may not assign this agreement without Producer's written consent; Producer may assign it. Notices may be sent by email to the addresses used for this purchase. If any part of this agreement is found unenforceable, the rest stays in effect. This is the entire agreement between Producer and Artist about this license, and it can only be changed in writing signed by both. Artist's electronic acceptance at checkout counts as Artist's signature.
$body$, now()
from public.license_tiers where slug = 'mp3'
on conflict (tier_id, version) do nothing;

insert into public.license_template_versions (tier_id, version, terms, agreement_body, published_at)
select id, 2, '{"files": ["WAV"], "distribution_copies": 5000, "audio_streams": 250000, "music_videos": 1, "video_streams": 250000, "radio_stations": 2, "term_years": 5, "credit_required": true, "licensee_may_register_content_id": false, "producer_publishing_share_pct": 50, "governing_law": "South Carolina", "venue": "Richland County, South Carolina", "ai_training_prohibited": true, "standalone_instrumental_prohibited": true, "draft": true}'::jsonb, $body$WAV LEASE AGREEMENT (NON-EXCLUSIVE)
Version 2

This agreement is between Pinnacle Forge Solutions LLC, doing business as BAGCHASERKASH ("Producer"), and {{licensee_name}} ({{licensee_email}}) ("Artist"). It covers the instrumental titled "{{beat_title}}" (the "Beat"), purchased under order {{order_number}} for a license fee of {{price}}. It takes effect on {{effective_date}}, but only once Producer has received the full license fee.

1. LICENSE GRANT
Producer grants Artist a non-exclusive, non-transferable license to record new vocals over the Beat to create one new song (the "Song") and to use the Song as described in this agreement. Producer keeps every right not expressly granted here.

2. FILES DELIVERED
One untagged WAV file of the Beat.

3. USAGE LIMITS
Artist may:
(a) distribute or sell up to 5,000 copies of the Song, combining downloads and physical copies;
(b) earn up to 250,000 audio streams of the Song, combined across all streaming services;
(c) make 1 music video(s) for the Song, with up to 250,000 combined video views;
(d) broadcast the Song on up to 2 radio station(s);
(e) perform the Song live at for-profit and non-profit performances.
Artist may release the Song through digital distributors (such as DistroKid, TuneCore, or CD Baby) within these limits. Once any limit is reached, Artist must buy a new license before any further use of that kind.

4. TERM
This license lasts 5 years from the effective date. After that, Artist must renew the license to keep distributing the Song.

5. OWNERSHIP AND PUBLISHING
Producer owns and keeps the copyright in the Beat, including the sound recording and the underlying music. This agreement does not transfer any ownership of the Beat to Artist. Artist owns Artist's lyrics and vocal performance. For the musical composition of the Song, Producer keeps a 50% share of the writer's and publisher's share, and Artist must list Producer with that share when registering the Song with any performing rights organization, publishing administrator, or similar service.

6. CREDIT
Artist must credit the Beat as "Prod. BAGCHASERKASH" in song titles or descriptions, streaming and distributor metadata, video descriptions, and anywhere credits are normally given.

7. CONTENT ID AND REGISTRATIONS
Artist may not register the Beat or the Song with YouTube Content ID or any similar audio-fingerprinting system, directly or through a distributor, and must turn off any such option a distributor offers. If a claim by Producer affects Artist's licensed use, Producer will release it after Artist provides proof of this license.

8. RESTRICTIONS
Artist may not:
(a) resell, share, give away, sublicense, or transfer the Beat or its files;
(b) release the Beat as an instrumental, or with only minor additions, instead of as part of a Song with substantial new vocals;
(c) claim to have produced or own the Beat;
(d) use the Beat in film, television, advertising, video games, or other synchronization beyond the music videos allowed above without a separate license;
(e) use the Beat or the Song to train, fine-tune, or prompt any artificial intelligence or machine-learning system, or to generate new instrumentals based on the Beat; or
(f) use the Beat for anything unlawful, defamatory, or infringing.

9. NON-EXCLUSIVITY
Producer may continue to license the Beat to others, including on an exclusive basis. If the Beat is later licensed exclusively to someone else, this license stays valid under its own terms.

10. ARTIST'S PROMISES
Artist promises that Artist's lyrics, vocals, and anything else Artist adds to the Song are original or properly cleared, and do not infringe anyone's rights. Artist will cover Producer's losses, including reasonable attorney fees, from any claim caused by Artist's additions to the Song or by Artist's breach of this agreement.

11. PRODUCER'S PROMISES AND LIABILITY
Producer promises that the Beat is Producer's original work, contains no uncleared samples, and that Producer has the right to grant this license. Except for that promise, the Beat is provided as-is. Producer's total liability under this agreement is limited to the license fee Artist paid.

12. REFUNDS AND TERMINATION
Because files are delivered digitally, sales are final once files are downloaded, except where the law requires otherwise. This license ends automatically if the payment is refunded or reversed through a chargeback, or if Artist materially breaches this agreement and does not fix the breach within 14 days of written notice. After the license ends, any further use of the Beat is copyright infringement. Sections 5, 6, 7, 10, and 11 continue after this agreement ends.

13. GENERAL
This agreement is governed by the laws of the State of South Carolina, and any lawsuit about it must be brought in the state or federal courts serving Richland County, South Carolina. Artist may not assign this agreement without Producer's written consent; Producer may assign it. Notices may be sent by email to the addresses used for this purchase. If any part of this agreement is found unenforceable, the rest stays in effect. This is the entire agreement between Producer and Artist about this license, and it can only be changed in writing signed by both. Artist's electronic acceptance at checkout counts as Artist's signature.
$body$, now()
from public.license_tiers where slug = 'wav'
on conflict (tier_id, version) do nothing;

insert into public.license_template_versions (tier_id, version, terms, agreement_body, published_at)
select id, 2, '{"files": ["WAV", "Stems"], "distribution_copies": 10000, "audio_streams": 500000, "music_videos": 2, "video_streams": 500000, "radio_stations": 5, "term_years": 5, "credit_required": true, "licensee_may_register_content_id": false, "producer_publishing_share_pct": 50, "governing_law": "South Carolina", "venue": "Richland County, South Carolina", "ai_training_prohibited": true, "standalone_instrumental_prohibited": true, "draft": true}'::jsonb, $body$TRACKOUT LEASE AGREEMENT (NON-EXCLUSIVE)
Version 2

This agreement is between Pinnacle Forge Solutions LLC, doing business as BAGCHASERKASH ("Producer"), and {{licensee_name}} ({{licensee_email}}) ("Artist"). It covers the instrumental titled "{{beat_title}}" (the "Beat"), purchased under order {{order_number}} for a license fee of {{price}}. It takes effect on {{effective_date}}, but only once Producer has received the full license fee.

1. LICENSE GRANT
Producer grants Artist a non-exclusive, non-transferable license to record new vocals over the Beat to create one new song (the "Song") and to use the Song as described in this agreement. Producer keeps every right not expressly granted here.

2. FILES DELIVERED
One untagged WAV file of the Beat and a ZIP of its individual track stems.

3. USAGE LIMITS
Artist may:
(a) distribute or sell up to 10,000 copies of the Song, combining downloads and physical copies;
(b) earn up to 500,000 audio streams of the Song, combined across all streaming services;
(c) make 2 music video(s) for the Song, with up to 500,000 combined video views;
(d) broadcast the Song on up to 5 radio station(s);
(e) perform the Song live at for-profit and non-profit performances.
Artist may release the Song through digital distributors (such as DistroKid, TuneCore, or CD Baby) within these limits. Once any limit is reached, Artist must buy a new license before any further use of that kind.

4. TERM
This license lasts 5 years from the effective date. After that, Artist must renew the license to keep distributing the Song.

5. OWNERSHIP AND PUBLISHING
Producer owns and keeps the copyright in the Beat, including the sound recording and the underlying music. This agreement does not transfer any ownership of the Beat to Artist. Artist owns Artist's lyrics and vocal performance. For the musical composition of the Song, Producer keeps a 50% share of the writer's and publisher's share, and Artist must list Producer with that share when registering the Song with any performing rights organization, publishing administrator, or similar service.

6. CREDIT
Artist must credit the Beat as "Prod. BAGCHASERKASH" in song titles or descriptions, streaming and distributor metadata, video descriptions, and anywhere credits are normally given.

7. CONTENT ID AND REGISTRATIONS
Artist may not register the Beat or the Song with YouTube Content ID or any similar audio-fingerprinting system, directly or through a distributor, and must turn off any such option a distributor offers. If a claim by Producer affects Artist's licensed use, Producer will release it after Artist provides proof of this license.

8. RESTRICTIONS
Artist may not:
(a) resell, share, give away, sublicense, or transfer the Beat or its files;
(b) release the Beat as an instrumental, or with only minor additions, instead of as part of a Song with substantial new vocals;
(c) claim to have produced or own the Beat;
(d) use the Beat in film, television, advertising, video games, or other synchronization beyond the music videos allowed above without a separate license;
(e) use the Beat or the Song to train, fine-tune, or prompt any artificial intelligence or machine-learning system, or to generate new instrumentals based on the Beat; or
(f) use the Beat for anything unlawful, defamatory, or infringing.

9. NON-EXCLUSIVITY
Producer may continue to license the Beat to others, including on an exclusive basis. If the Beat is later licensed exclusively to someone else, this license stays valid under its own terms.

10. ARTIST'S PROMISES
Artist promises that Artist's lyrics, vocals, and anything else Artist adds to the Song are original or properly cleared, and do not infringe anyone's rights. Artist will cover Producer's losses, including reasonable attorney fees, from any claim caused by Artist's additions to the Song or by Artist's breach of this agreement.

11. PRODUCER'S PROMISES AND LIABILITY
Producer promises that the Beat is Producer's original work, contains no uncleared samples, and that Producer has the right to grant this license. Except for that promise, the Beat is provided as-is. Producer's total liability under this agreement is limited to the license fee Artist paid.

12. REFUNDS AND TERMINATION
Because files are delivered digitally, sales are final once files are downloaded, except where the law requires otherwise. This license ends automatically if the payment is refunded or reversed through a chargeback, or if Artist materially breaches this agreement and does not fix the breach within 14 days of written notice. After the license ends, any further use of the Beat is copyright infringement. Sections 5, 6, 7, 10, and 11 continue after this agreement ends.

13. GENERAL
This agreement is governed by the laws of the State of South Carolina, and any lawsuit about it must be brought in the state or federal courts serving Richland County, South Carolina. Artist may not assign this agreement without Producer's written consent; Producer may assign it. Notices may be sent by email to the addresses used for this purchase. If any part of this agreement is found unenforceable, the rest stays in effect. This is the entire agreement between Producer and Artist about this license, and it can only be changed in writing signed by both. Artist's electronic acceptance at checkout counts as Artist's signature.
$body$, now()
from public.license_tiers where slug = 'trackout'
on conflict (tier_id, version) do nothing;

insert into public.license_template_versions (tier_id, version, terms, agreement_body, published_at)
select id, 2, '{"files": ["WAV", "Stems"], "distribution_copies": null, "audio_streams": null, "music_videos": null, "video_streams": null, "radio_stations": null, "term_years": 10, "credit_required": true, "licensee_may_register_content_id": false, "producer_publishing_share_pct": 50, "governing_law": "South Carolina", "venue": "Richland County, South Carolina", "ai_training_prohibited": true, "standalone_instrumental_prohibited": true, "draft": true}'::jsonb, $body$UNLIMITED LICENSE AGREEMENT (NON-EXCLUSIVE)
Version 2

This agreement is between Pinnacle Forge Solutions LLC, doing business as BAGCHASERKASH ("Producer"), and {{licensee_name}} ({{licensee_email}}) ("Artist"). It covers the instrumental titled "{{beat_title}}" (the "Beat"), purchased under order {{order_number}} for a license fee of {{price}}. It takes effect on {{effective_date}}, but only once Producer has received the full license fee.

1. LICENSE GRANT
Producer grants Artist a non-exclusive, non-transferable license to record new vocals over the Beat to create one new song (the "Song") and to use the Song as described in this agreement. Producer keeps every right not expressly granted here.

2. FILES DELIVERED
One untagged WAV file of the Beat and a ZIP of its individual track stems.

3. USAGE LIMITS
Artist may:
(a) distribute or sell up to unlimited copies of the Song, combining downloads and physical copies;
(b) earn up to unlimited audio streams of the Song, combined across all streaming services;
(c) make unlimited music video(s) for the Song, with up to unlimited combined video views;
(d) broadcast the Song on unlimited radio station(s);
(e) perform the Song live at for-profit and non-profit performances.
Artist may release the Song through digital distributors (such as DistroKid, TuneCore, or CD Baby) within these limits. Once any limit is reached, Artist must buy a new license before any further use of that kind.

4. TERM
This license lasts 10 years from the effective date. After that, Artist must renew the license to keep distributing the Song.

5. OWNERSHIP AND PUBLISHING
Producer owns and keeps the copyright in the Beat, including the sound recording and the underlying music. This agreement does not transfer any ownership of the Beat to Artist. Artist owns Artist's lyrics and vocal performance. For the musical composition of the Song, Producer keeps a 50% share of the writer's and publisher's share, and Artist must list Producer with that share when registering the Song with any performing rights organization, publishing administrator, or similar service.

6. CREDIT
Artist must credit the Beat as "Prod. BAGCHASERKASH" in song titles or descriptions, streaming and distributor metadata, video descriptions, and anywhere credits are normally given.

7. CONTENT ID AND REGISTRATIONS
Artist may not register the Beat or the Song with YouTube Content ID or any similar audio-fingerprinting system, directly or through a distributor, and must turn off any such option a distributor offers. If a claim by Producer affects Artist's licensed use, Producer will release it after Artist provides proof of this license.

8. RESTRICTIONS
Artist may not:
(a) resell, share, give away, sublicense, or transfer the Beat or its files;
(b) release the Beat as an instrumental, or with only minor additions, instead of as part of a Song with substantial new vocals;
(c) claim to have produced or own the Beat;
(d) use the Beat in film, television, advertising, video games, or other synchronization beyond the music videos allowed above without a separate license;
(e) use the Beat or the Song to train, fine-tune, or prompt any artificial intelligence or machine-learning system, or to generate new instrumentals based on the Beat; or
(f) use the Beat for anything unlawful, defamatory, or infringing.

9. NON-EXCLUSIVITY
Producer may continue to license the Beat to others, including on an exclusive basis. If the Beat is later licensed exclusively to someone else, this license stays valid under its own terms.

10. ARTIST'S PROMISES
Artist promises that Artist's lyrics, vocals, and anything else Artist adds to the Song are original or properly cleared, and do not infringe anyone's rights. Artist will cover Producer's losses, including reasonable attorney fees, from any claim caused by Artist's additions to the Song or by Artist's breach of this agreement.

11. PRODUCER'S PROMISES AND LIABILITY
Producer promises that the Beat is Producer's original work, contains no uncleared samples, and that Producer has the right to grant this license. Except for that promise, the Beat is provided as-is. Producer's total liability under this agreement is limited to the license fee Artist paid.

12. REFUNDS AND TERMINATION
Because files are delivered digitally, sales are final once files are downloaded, except where the law requires otherwise. This license ends automatically if the payment is refunded or reversed through a chargeback, or if Artist materially breaches this agreement and does not fix the breach within 14 days of written notice. After the license ends, any further use of the Beat is copyright infringement. Sections 5, 6, 7, 10, and 11 continue after this agreement ends.

13. GENERAL
This agreement is governed by the laws of the State of South Carolina, and any lawsuit about it must be brought in the state or federal courts serving Richland County, South Carolina. Artist may not assign this agreement without Producer's written consent; Producer may assign it. Notices may be sent by email to the addresses used for this purchase. If any part of this agreement is found unenforceable, the rest stays in effect. This is the entire agreement between Producer and Artist about this license, and it can only be changed in writing signed by both. Artist's electronic acceptance at checkout counts as Artist's signature.
$body$, now()
from public.license_tiers where slug = 'unlimited'
on conflict (tier_id, version) do nothing;

insert into public.license_template_versions (tier_id, version, terms, agreement_body, published_at)
select id, 2, '{"credit_required": true, "licensee_may_register_content_id": true, "producer_publishing_share_pct": 50, "governing_law": "South Carolina", "venue": "Richland County, South Carolina", "ai_training_prohibited": true, "standalone_instrumental_prohibited": true, "draft": true, "files": ["WAV", "Stems"], "term_years": null}'::jsonb, $body$EXCLUSIVE LICENSE AGREEMENT
Version 2

This agreement is between Pinnacle Forge Solutions LLC, doing business as BAGCHASERKASH ("Producer"), and {{licensee_name}} ({{licensee_email}}) ("Artist"). It covers the instrumental titled "{{beat_title}}" (the "Beat"), purchased under order {{order_number}} for a license fee of {{price}}. It takes effect on {{effective_date}}, but only once Producer has received the full license fee.

1. EXCLUSIVE LICENSE
Producer grants Artist an exclusive license to record new vocals over the Beat to create one new song (the "Song") and to use the Song with no limits on copies, streams, music videos, radio, or live performances. Starting on the effective date, Producer will remove the Beat from sale and will not license it to anyone else.

2. EARLIER LICENSES
Non-exclusive licenses Producer granted before the effective date remain valid under their own terms. Producer will provide a list of them on request.

3. FILES DELIVERED
One untagged WAV file of the Beat and a ZIP of its individual track stems.

4. OWNERSHIP AND PUBLISHING
Producer owns and keeps the copyright in the Beat. This agreement does not transfer ownership of the Beat unless a separate written agreement signed by both parties says so. For the musical composition of the Song, Producer keeps a 50% share of the writer's and publisher's share, and Artist must list Producer with that share when registering the Song.

5. CREDIT
Artist must credit the Beat as "Prod. BAGCHASERKASH" wherever credits are normally given.

6. CONTENT ID
Artist may register the Song with YouTube Content ID and similar systems, and must whitelist Producer's channels and any earlier licensees promptly on request.

7. RESTRICTIONS
Artist may not resell or transfer the Beat files, release the Beat as an instrumental without substantial new vocals, claim to have produced the Beat, or use the Beat or Song to train or prompt any artificial intelligence or machine-learning system. Synchronization in film, television, advertising, and video games is allowed for the Song.

8. PROMISES AND LIABILITY
Producer promises that the Beat is Producer's original work, contains no uncleared samples, and that Producer has the right to grant this license. Artist promises that Artist's additions to the Song are original or cleared, and will cover Producer's losses, including reasonable attorney fees, from claims caused by them. Producer's total liability is limited to the license fee paid.

9. TERM AND TERMINATION
This license does not expire. It ends if the payment is refunded or reversed through a chargeback, after which the Beat may be offered for sale again.

10. GENERAL
This agreement is governed by the laws of the State of South Carolina, and any lawsuit about it must be brought in the courts serving Richland County, South Carolina. Any additional terms agreed in writing for this sale are part of this agreement. If any part is found unenforceable, the rest stays in effect. Artist's electronic acceptance counts as Artist's signature.
$body$, now()
from public.license_tiers where slug = 'exclusive'
on conflict (tier_id, version) do nothing;
