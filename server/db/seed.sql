INSERT INTO public.users (id, name, cell, email) VALUES
(1, 'Alice Johnson', 3125551234, 'alice.johnson@uchicago.edu'),
(2, 'Bob Lee', 7735555678, 'bob.lee@uchicago.edu'),
(3, 'Carmen Davis', 2245559012, 'carmen.davis@uchicago.edu'),
(4, 'David Kim', 8475553456, 'david.kim@uchicago.edu'),
(5, 'Ella Thompson', 6305557890, 'ella.thompson@uchicago.edu');

INSERT INTO public.food_orders (id, owner_id, is_open, size, expiration, started_at, location, restaurant) VALUES
(1, 1, true, 3, '18:00:00', '2025-05-05 12:00:00', 'Regenstein Library', 'Chipotle'),
(2, 2, true, 4, '19:30:00', '2025-05-05 13:15:00', 'Harper Library', 'Shake Shack'),
(3, 3, false, 2, '17:45:00', '2025-05-05 11:30:00', 'John Crerar Library', 'Subway'),
(4, 1, true, 5, '20:00:00', '2025-05-05 14:00:00', 'Regenstein Library', 'flexible'),
(5, 4, true, 3, '19:00:00', '2025-05-05 13:45:00', 'Harper Library', 'Five Guys'),
(6, 2, false, 2, '16:30:00', '2025-05-05 10:30:00', 'John Crerar Library', 'flexible');

INSERT INTO public.order_groups (order_id, user_id, created_at) VALUES
(1, 1, '10:15:00'),
(2, 2, '12:30:00'),
(3, 3, '15:45:00'),
(4, 2, '11:00:00'),
(5, 1, '13:15:00');
