-- Version 1 license agreements (DRAFTS pending attorney review).
-- Run once in Supabase SQL Editor.

insert into public.license_template_versions (tier_id, version, terms, agreement_body, published_at)
select id, 1, '{"files": ["MP3"], "distribution_copies": 2500, "audio_streams": 100000, "music_videos": 1, "video_streams": 100000, "radio_stations": 0, "term_years": 3, "credit_required": true, "licensee_may_register_content_id": false, "producer_publishing_share_pct": 50, "governing_law": "South Carolina", "draft": true}'::jsonb, $body$MP3 LEASE AGREEMENT (NON-EXCLUSIVE)
Version 1

This agreement is between Pinnacle Forge Solutions LLC, doing business as BAGCHASERKASH ("Producer"), and {{licensee_name}} ({{licensee_email}}) ("Artist"). It is effective {{effective_date}} and covers the instrumental titled "{{beat_title}}" (the "Beat"), purchased under order {{order_number}} for a license fee of {{price}}.

1. LICENSE GRANT
Producer grants Artist a non-exclusive, non-transferable license to record vocals over the Beat to create one new song (the "Song") and to use the Song as described in this agreement. Producer keeps every right not expressly granted here.

2. FILES DELIVERED
One untagged MP3 file of the Beat.

3. USAGE LIMITS
Artist may:
(a) distribute or sell up to 2,500 copies of the Song, combining downloads and physical copies;
(b) earn up to 100,000 audio streams of the Song, combined across all streaming services;
(c) make 1 music video(s) for the Song, with up to 100,000 combined video views;
(d) broadcast the Song on up to 0 radio station(s); and
(e) perform the Song live at for-profit and non-profit performances.
Once any limit is reached, Artist must obtain a new license before further use of that kind.

4. TERM
This license lasts 3 years from the effective date. After that, Artist must renew the license to keep distributing the Song.

5. OWNERSHIP AND PUBLISHING
Producer owns and keeps the copyright in the Beat. This agreement does not transfer ownership of the Beat to Artist. Artist owns Artist's lyrics and vocal performance. For the musical composition of the Song, Producer keeps a 50% share of the writer's and publisher's share, and Artist must list Producer accordingly when registering the Song with a performing rights organization.

6. CREDIT
Artist must credit the Beat as "Prod. BAGCHASERKASH" in song titles, video descriptions, streaming metadata, and anywhere credits are normally given.

7. CONTENT ID AND REGISTRATIONS
Artist may not register the Beat or the Song with YouTube Content ID or any similar audio-fingerprinting system. If a claim by Producer affects Artist's licensed use, Producer will release it after Artist provides proof of this license.

8. RESTRICTIONS
Artist may not: (a) resell, share, sublicense, or transfer the Beat or its files; (b) claim to have produced the Beat; (c) use the Beat in film, television, advertising, video games, or other synchronization beyond the music videos allowed above without a separate license; or (d) use the Beat for anything unlawful or defamatory.

9. NON-EXCLUSIVITY
Producer may continue to license the Beat to others, including on an exclusive basis. If the Beat is later licensed exclusively to someone else, this license stays valid under its own terms.

10. REFUNDS AND TERMINATION
Because the files are delivered digitally, sales are final once files are downloaded, except where the law requires otherwise. This license ends automatically if the payment is refunded or reversed through a chargeback, or if Artist materially breaches this agreement and does not fix the breach within 14 days of written notice.

11. PRODUCER'S PROMISES AND LIABILITY
Producer promises that the Beat is Producer's original work, contains no uncleared samples, and that Producer has the right to grant this license. Producer's total liability under this agreement is limited to the license fee paid.

12. GENERAL
This agreement is governed by the laws of the State of South Carolina. It is the entire agreement between Producer and Artist about this license. Artist's electronic acceptance at checkout counts as Artist's signature.
$body$, now()
from public.license_tiers where slug = 'mp3';

insert into public.license_template_versions (tier_id, version, terms, agreement_body, published_at)
select id, 1, '{"files": ["WAV"], "distribution_copies": 5000, "audio_streams": 250000, "music_videos": 1, "video_streams": 250000, "radio_stations": 2, "term_years": 5, "credit_required": true, "licensee_may_register_content_id": false, "producer_publishing_share_pct": 50, "governing_law": "South Carolina", "draft": true}'::jsonb, $body$WAV LEASE AGREEMENT (NON-EXCLUSIVE)
Version 1

This agreement is between Pinnacle Forge Solutions LLC, doing business as BAGCHASERKASH ("Producer"), and {{licensee_name}} ({{licensee_email}}) ("Artist"). It is effective {{effective_date}} and covers the instrumental titled "{{beat_title}}" (the "Beat"), purchased under order {{order_number}} for a license fee of {{price}}.

1. LICENSE GRANT
Producer grants Artist a non-exclusive, non-transferable license to record vocals over the Beat to create one new song (the "Song") and to use the Song as described in this agreement. Producer keeps every right not expressly granted here.

2. FILES DELIVERED
One untagged WAV file of the Beat.

3. USAGE LIMITS
Artist may:
(a) distribute or sell up to 5,000 copies of the Song, combining downloads and physical copies;
(b) earn up to 250,000 audio streams of the Song, combined across all streaming services;
(c) make 1 music video(s) for the Song, with up to 250,000 combined video views;
(d) broadcast the Song on up to 2 radio station(s); and
(e) perform the Song live at for-profit and non-profit performances.
Once any limit is reached, Artist must obtain a new license before further use of that kind.

4. TERM
This license lasts 5 years from the effective date. After that, Artist must renew the license to keep distributing the Song.

5. OWNERSHIP AND PUBLISHING
Producer owns and keeps the copyright in the Beat. This agreement does not transfer ownership of the Beat to Artist. Artist owns Artist's lyrics and vocal performance. For the musical composition of the Song, Producer keeps a 50% share of the writer's and publisher's share, and Artist must list Producer accordingly when registering the Song with a performing rights organization.

6. CREDIT
Artist must credit the Beat as "Prod. BAGCHASERKASH" in song titles, video descriptions, streaming metadata, and anywhere credits are normally given.

7. CONTENT ID AND REGISTRATIONS
Artist may not register the Beat or the Song with YouTube Content ID or any similar audio-fingerprinting system. If a claim by Producer affects Artist's licensed use, Producer will release it after Artist provides proof of this license.

8. RESTRICTIONS
Artist may not: (a) resell, share, sublicense, or transfer the Beat or its files; (b) claim to have produced the Beat; (c) use the Beat in film, television, advertising, video games, or other synchronization beyond the music videos allowed above without a separate license; or (d) use the Beat for anything unlawful or defamatory.

9. NON-EXCLUSIVITY
Producer may continue to license the Beat to others, including on an exclusive basis. If the Beat is later licensed exclusively to someone else, this license stays valid under its own terms.

10. REFUNDS AND TERMINATION
Because the files are delivered digitally, sales are final once files are downloaded, except where the law requires otherwise. This license ends automatically if the payment is refunded or reversed through a chargeback, or if Artist materially breaches this agreement and does not fix the breach within 14 days of written notice.

11. PRODUCER'S PROMISES AND LIABILITY
Producer promises that the Beat is Producer's original work, contains no uncleared samples, and that Producer has the right to grant this license. Producer's total liability under this agreement is limited to the license fee paid.

12. GENERAL
This agreement is governed by the laws of the State of South Carolina. It is the entire agreement between Producer and Artist about this license. Artist's electronic acceptance at checkout counts as Artist's signature.
$body$, now()
from public.license_tiers where slug = 'wav';

insert into public.license_template_versions (tier_id, version, terms, agreement_body, published_at)
select id, 1, '{"files": ["WAV", "Stems"], "distribution_copies": 10000, "audio_streams": 500000, "music_videos": 2, "video_streams": 500000, "radio_stations": 5, "term_years": 5, "credit_required": true, "licensee_may_register_content_id": false, "producer_publishing_share_pct": 50, "governing_law": "South Carolina", "draft": true}'::jsonb, $body$TRACKOUT LEASE AGREEMENT (NON-EXCLUSIVE)
Version 1

This agreement is between Pinnacle Forge Solutions LLC, doing business as BAGCHASERKASH ("Producer"), and {{licensee_name}} ({{licensee_email}}) ("Artist"). It is effective {{effective_date}} and covers the instrumental titled "{{beat_title}}" (the "Beat"), purchased under order {{order_number}} for a license fee of {{price}}.

1. LICENSE GRANT
Producer grants Artist a non-exclusive, non-transferable license to record vocals over the Beat to create one new song (the "Song") and to use the Song as described in this agreement. Producer keeps every right not expressly granted here.

2. FILES DELIVERED
One untagged WAV file of the Beat and a ZIP of its individual track stems.

3. USAGE LIMITS
Artist may:
(a) distribute or sell up to 10,000 copies of the Song, combining downloads and physical copies;
(b) earn up to 500,000 audio streams of the Song, combined across all streaming services;
(c) make 2 music video(s) for the Song, with up to 500,000 combined video views;
(d) broadcast the Song on up to 5 radio station(s); and
(e) perform the Song live at for-profit and non-profit performances.
Once any limit is reached, Artist must obtain a new license before further use of that kind.

4. TERM
This license lasts 5 years from the effective date. After that, Artist must renew the license to keep distributing the Song.

5. OWNERSHIP AND PUBLISHING
Producer owns and keeps the copyright in the Beat. This agreement does not transfer ownership of the Beat to Artist. Artist owns Artist's lyrics and vocal performance. For the musical composition of the Song, Producer keeps a 50% share of the writer's and publisher's share, and Artist must list Producer accordingly when registering the Song with a performing rights organization.

6. CREDIT
Artist must credit the Beat as "Prod. BAGCHASERKASH" in song titles, video descriptions, streaming metadata, and anywhere credits are normally given.

7. CONTENT ID AND REGISTRATIONS
Artist may not register the Beat or the Song with YouTube Content ID or any similar audio-fingerprinting system. If a claim by Producer affects Artist's licensed use, Producer will release it after Artist provides proof of this license.

8. RESTRICTIONS
Artist may not: (a) resell, share, sublicense, or transfer the Beat or its files; (b) claim to have produced the Beat; (c) use the Beat in film, television, advertising, video games, or other synchronization beyond the music videos allowed above without a separate license; or (d) use the Beat for anything unlawful or defamatory.

9. NON-EXCLUSIVITY
Producer may continue to license the Beat to others, including on an exclusive basis. If the Beat is later licensed exclusively to someone else, this license stays valid under its own terms.

10. REFUNDS AND TERMINATION
Because the files are delivered digitally, sales are final once files are downloaded, except where the law requires otherwise. This license ends automatically if the payment is refunded or reversed through a chargeback, or if Artist materially breaches this agreement and does not fix the breach within 14 days of written notice.

11. PRODUCER'S PROMISES AND LIABILITY
Producer promises that the Beat is Producer's original work, contains no uncleared samples, and that Producer has the right to grant this license. Producer's total liability under this agreement is limited to the license fee paid.

12. GENERAL
This agreement is governed by the laws of the State of South Carolina. It is the entire agreement between Producer and Artist about this license. Artist's electronic acceptance at checkout counts as Artist's signature.
$body$, now()
from public.license_tiers where slug = 'trackout';

insert into public.license_template_versions (tier_id, version, terms, agreement_body, published_at)
select id, 1, '{"files": ["WAV", "Stems"], "distribution_copies": null, "audio_streams": null, "music_videos": null, "video_streams": null, "radio_stations": null, "term_years": 10, "credit_required": true, "licensee_may_register_content_id": false, "producer_publishing_share_pct": 50, "governing_law": "South Carolina", "draft": true}'::jsonb, $body$UNLIMITED LICENSE AGREEMENT (NON-EXCLUSIVE)
Version 1

This agreement is between Pinnacle Forge Solutions LLC, doing business as BAGCHASERKASH ("Producer"), and {{licensee_name}} ({{licensee_email}}) ("Artist"). It is effective {{effective_date}} and covers the instrumental titled "{{beat_title}}" (the "Beat"), purchased under order {{order_number}} for a license fee of {{price}}.

1. LICENSE GRANT
Producer grants Artist a non-exclusive, non-transferable license to record vocals over the Beat to create one new song (the "Song") and to use the Song as described in this agreement. Producer keeps every right not expressly granted here.

2. FILES DELIVERED
One untagged WAV file of the Beat and a ZIP of its individual track stems.

3. USAGE LIMITS
Artist may:
(a) distribute or sell up to unlimited copies of the Song, combining downloads and physical copies;
(b) earn up to unlimited audio streams of the Song, combined across all streaming services;
(c) make unlimited music video(s) for the Song, with up to unlimited combined video views;
(d) broadcast the Song on up to unlimited radio station(s); and
(e) perform the Song live at for-profit and non-profit performances.
Once any limit is reached, Artist must obtain a new license before further use of that kind.

4. TERM
This license lasts 10 years from the effective date. After that, Artist must renew the license to keep distributing the Song.

5. OWNERSHIP AND PUBLISHING
Producer owns and keeps the copyright in the Beat. This agreement does not transfer ownership of the Beat to Artist. Artist owns Artist's lyrics and vocal performance. For the musical composition of the Song, Producer keeps a 50% share of the writer's and publisher's share, and Artist must list Producer accordingly when registering the Song with a performing rights organization.

6. CREDIT
Artist must credit the Beat as "Prod. BAGCHASERKASH" in song titles, video descriptions, streaming metadata, and anywhere credits are normally given.

7. CONTENT ID AND REGISTRATIONS
Artist may not register the Beat or the Song with YouTube Content ID or any similar audio-fingerprinting system. If a claim by Producer affects Artist's licensed use, Producer will release it after Artist provides proof of this license.

8. RESTRICTIONS
Artist may not: (a) resell, share, sublicense, or transfer the Beat or its files; (b) claim to have produced the Beat; (c) use the Beat in film, television, advertising, video games, or other synchronization beyond the music videos allowed above without a separate license; or (d) use the Beat for anything unlawful or defamatory.

9. NON-EXCLUSIVITY
Producer may continue to license the Beat to others, including on an exclusive basis. If the Beat is later licensed exclusively to someone else, this license stays valid under its own terms.

10. REFUNDS AND TERMINATION
Because the files are delivered digitally, sales are final once files are downloaded, except where the law requires otherwise. This license ends automatically if the payment is refunded or reversed through a chargeback, or if Artist materially breaches this agreement and does not fix the breach within 14 days of written notice.

11. PRODUCER'S PROMISES AND LIABILITY
Producer promises that the Beat is Producer's original work, contains no uncleared samples, and that Producer has the right to grant this license. Producer's total liability under this agreement is limited to the license fee paid.

12. GENERAL
This agreement is governed by the laws of the State of South Carolina. It is the entire agreement between Producer and Artist about this license. Artist's electronic acceptance at checkout counts as Artist's signature.
$body$, now()
from public.license_tiers where slug = 'unlimited';

insert into public.license_template_versions (tier_id, version, terms, agreement_body, published_at)
select id, 1, '{"credit_required": true, "licensee_may_register_content_id": true, "producer_publishing_share_pct": 50, "governing_law": "South Carolina", "draft": true, "files": ["WAV", "Stems"], "term_years": null}'::jsonb, $body$EXCLUSIVE LICENSE AGREEMENT
Version 1

This agreement is between Pinnacle Forge Solutions LLC, doing business as BAGCHASERKASH ("Producer"), and {{licensee_name}} ({{licensee_email}}) ("Artist"). It is effective {{effective_date}} and covers the instrumental titled "{{beat_title}}" (the "Beat"), purchased under order {{order_number}} for a license fee of {{price}}.

1. EXCLUSIVE LICENSE
Producer grants Artist an exclusive license to use the Beat to create and exploit one new song (the "Song"), with no limits on copies, streams, music videos, radio, or live performances. After the effective date, Producer will not license the Beat to anyone else.

2. EARLIER LICENSES
Non-exclusive licenses Producer granted before the effective date remain valid under their own terms. Producer will provide a list of them on request.

3. FILES DELIVERED
One untagged WAV file of the Beat and a ZIP of its individual track stems.

4. OWNERSHIP AND PUBLISHING
Producer owns and keeps the copyright in the Beat. This agreement does not transfer ownership of the Beat unless a separate written agreement signed by both parties says so. For the musical composition of the Song, Producer keeps a 50% share of the writer's and publisher's share.

5. CREDIT
Artist must credit the Beat as "Prod. BAGCHASERKASH" wherever credits are normally given.

6. CONTENT ID
Artist may register the Song with YouTube Content ID and similar systems, and must whitelist Producer's channels and any earlier licensees on request.

7. TERM
This license does not expire.

8. TERMINATION
This license ends if the payment is refunded or reversed through a chargeback.

9. GENERAL
This agreement is governed by the laws of the State of South Carolina. Any additional terms agreed in writing for this sale are part of this agreement. Artist's electronic acceptance counts as Artist's signature.
$body$, now()
from public.license_tiers where slug = 'exclusive';
