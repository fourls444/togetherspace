UPDATE public.board_items
SET poll_allow_vote_cancel = true
WHERE item_type = 'poll';
