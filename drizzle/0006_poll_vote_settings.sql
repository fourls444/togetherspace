ALTER TABLE public.board_items
ADD COLUMN IF NOT EXISTS poll_max_votes_per_user integer NOT NULL DEFAULT 1;

ALTER TABLE public.board_items
ADD COLUMN IF NOT EXISTS poll_allow_vote_cancel boolean NOT NULL DEFAULT true;

ALTER TABLE public.board_items
DROP CONSTRAINT IF EXISTS board_items_poll_max_votes_positive;

ALTER TABLE public.board_items
ADD CONSTRAINT board_items_poll_max_votes_positive
CHECK (poll_max_votes_per_user > 0);
