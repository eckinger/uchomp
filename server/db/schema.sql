--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4 (Debian 17.4-1.pgdg120+2)
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: locs; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.locs AS ENUM (
    'Regenstein Library',
    'Harper Library',
    'John Crerar Library'
);


--
-- Name: create_food_order(uuid, text, timestamp with time zone, public.locs); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_food_order(p_owner_id uuid, p_restaurant text, p_expiration timestamp with time zone, p_location public.locs) RETURNS TABLE(success boolean, order_id uuid, error text)
    LANGUAGE plpgsql
    AS $$

DECLARE
  v_user_exists BOOLEAN;
BEGIN
  -- Validate restaurant
  IF TRIM(p_restaurant) = '' THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Restaurant name is required.';
    RETURN;
  END IF;

  -- Validate expiration
  IF p_expiration <= NOW() THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Expiration must be in the future.';
    RETURN;
  END IF;

  -- Validate user existence
  SELECT EXISTS(SELECT 1 FROM users WHERE id = p_owner_id) INTO v_user_exists;
  IF NOT v_user_exists THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'User not found.';
    RETURN;
  END IF;

  -- Insert order
  INSERT INTO food_orders (owner_id, restaurant, expiration, location)
  VALUES (p_owner_id, p_restaurant, p_expiration, p_location)
  RETURNING id INTO order_id;

  -- Add owner to order_groups
  INSERT INTO order_groups (food_order_id, user_id, created_at)
  VALUES (order_id, p_owner_id, CURRENT_TIME);

  RETURN QUERY SELECT TRUE, order_id, NULL;
END;
$$;


--
-- Name: create_verification_code(text, integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.create_verification_code(IN p_email text, IN p_key integer)
    LANGUAGE plpgsql
    AS $$

BEGIN

  INSERT INTO codes(email, key, created_at, expiration)

  VALUES (p_email, p_key, NOW(), NOW() + interval '15 minutes')

  ON CONFLICT (email)

  DO UPDATE SET key = EXCLUDED.key, created_at = EXCLUDED.created_at;

END;

$$;


--
-- Name: delete_order(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_order(p_order_id uuid) RETURNS TABLE(success boolean, error text)
    LANGUAGE plpgsql
    AS $$

DECLARE

  v_exists BOOLEAN;

BEGIN

  -- Check existence

  SELECT EXISTS(SELECT 1 FROM food_orders WHERE id = p_order_id) INTO v_exists;



  IF NOT v_exists THEN

    RETURN QUERY SELECT FALSE, 'Order not found.';

    RETURN;

  END IF;



  -- Delete from order_groups

  DELETE FROM order_groups WHERE id = p_order_id;


  DELETE FROM order_groups WHERE food_order_id = p_order_id;

  -- Delete from food_orders

  DELETE FROM food_orders WHERE id = p_order_id;



  RETURN QUERY SELECT TRUE, NULL;

END;

$$;


--
-- Name: ensure_user_exists(text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.ensure_user_exists(IN p_email text)
    LANGUAGE plpgsql
    AS $$

BEGIN

  -- Check if user exists; if not, insert them

  IF NOT EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN

    INSERT INTO users (email) VALUES (p_email);

  END IF;

END;

$$;


--
-- Name: get_active_orders(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_active_orders() RETURNS TABLE(id uuid, owner_id uuid, restaurant text, expiration timestamp without time zone, loc public.locs, participant_count bigint, participants uuid[])
    LANGUAGE plpgsql
    AS $$

BEGIN

  RETURN QUERY

  SELECT

    fo.id,

    fo.owner_id,

    fo.restaurant,

    fo.expiration,

    fo.location,

    (

      SELECT COUNT(og.user_id)

      FROM order_groups og

      WHERE og.food_order_id = fo.id

    ) AS participant_count,

    (

      SELECT ARRAY_AGG(og.user_id)

      FROM order_groups og

      WHERE og.food_order_id = fo.id

    ) AS participants

  FROM food_orders fo

  WHERE fo.expiration > NOW()

  ORDER BY fo.expiration ASC;

END;

$$;


--
-- Name: get_orders(public.locs); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_orders(p_location TEXT DEFAULT NULL)
RETURNS TABLE(success BOOLEAN, location public.locs, orders JSON, error TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_location public.locs;
BEGIN
  -- Validate location manually
  IF p_location IS NOT NULL THEN
    IF p_location NOT IN ('Regenstein Library', 'Harper Library', 'John Crerar Library') THEN
      RETURN QUERY SELECT TRUE, NULL::public.locs, '[]'::JSON, NULL;
      RETURN;
    END IF;

    v_location := p_location::public.locs;
  ELSE
    v_location := NULL;
  END IF;

  RETURN QUERY
  SELECT 
    TRUE,
    v_location,
    (
      SELECT JSON_AGG(row_to_json(o))
      FROM (
        SELECT
          fo.id,
          fo.owner_id,
          fo.restaurant,
          fo.expiration,
          fo.location,
          (
            SELECT COUNT(*) FROM order_groups og WHERE og.food_order_id = fo.id
          ) AS participant_count,
          (
            SELECT ARRAY_AGG(og.user_id) FROM order_groups og WHERE og.food_order_id = fo.id
          ) AS participants
        FROM food_orders fo
        WHERE fo.expiration > NOW()
          AND fo.is_open = true
          AND (v_location IS NULL OR fo.location = v_location)
        ORDER BY fo.expiration
      ) o
    ),
    NULL;
END;
$$;



--
-- Name: join_order(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.join_order(p_user_id uuid, p_group_id uuid) RETURNS TABLE(success boolean, error text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_owner_id UUID;
    v_expiration TIMESTAMP;
    v_exists INTEGER;
BEGIN
    -- Check if order exists and retrieve owner and expiration
    SELECT owner_id, expiration
    INTO v_owner_id, v_expiration
    FROM food_orders
    WHERE id = p_group_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Order not found';
        RETURN;
    END IF;

    -- User cannot join their own order
    IF v_owner_id = p_user_id THEN
        RETURN QUERY SELECT FALSE, 'You cannot join your own order';
        RETURN;
    END IF;

    -- Check expiration
    IF v_expiration < now() THEN
        RETURN QUERY SELECT FALSE, 'This group has expired';
        RETURN;
    END IF;

    -- Check if already a member
    SELECT 1
    INTO v_exists
    FROM order_groups
    WHERE food_order_id = p_group_id AND user_id = p_user_id;

    IF FOUND THEN
        RETURN QUERY SELECT FALSE, 'You are already a member of this group';
        RETURN;
    END IF;

    -- Insert into order_groups
    INSERT INTO order_groups (food_order_id, user_id)
    VALUES (p_group_id, p_user_id);

    RETURN QUERY SELECT TRUE, NULL;
END;
$$;


--
-- Name: leave_order(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.leave_order(p_user_id uuid, p_order_id uuid) RETURNS TABLE(success boolean, error text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_is_member BOOLEAN;
    v_owner_id UUID;
    v_participant_count INT;
    v_new_owner_id UUID;
BEGIN
    -- Check if user is a member of the order group
    SELECT EXISTS (
        SELECT 1 FROM order_groups 
        WHERE user_id = p_user_id AND food_order_id = p_order_id
    ) INTO v_is_member;

    IF NOT v_is_member THEN
        RETURN QUERY SELECT FALSE, 'User is not a member of this order';
        RETURN;
    END IF;

    -- Get the current owner of the order
    SELECT owner_id INTO v_owner_id FROM food_orders WHERE id = p_order_id;

    -- Remove user from order group
    DELETE FROM order_groups 
    WHERE user_id = p_user_id AND food_order_id = p_order_id;

    -- Count remaining participants
    SELECT COUNT(*) INTO v_participant_count
    FROM order_groups WHERE food_order_id = p_order_id;

    -- If no participants left, delete the order
    IF v_participant_count = 0 THEN
        DELETE FROM food_orders WHERE id = p_order_id;
        RETURN QUERY SELECT TRUE, NULL;
        RETURN;
    END IF;

    -- If user is owner, reassign to another user
    IF v_owner_id = p_user_id THEN
        SELECT user_id INTO v_new_owner_id
        FROM order_groups
        WHERE food_order_id = p_order_id
        LIMIT 1;

        UPDATE food_orders
        SET owner_id = v_new_owner_id
        WHERE id = p_order_id;
    END IF;

    RETURN QUERY SELECT TRUE, NULL;
END;
$$;


--
-- Name: update_name_and_cell(text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_name_and_cell(p_email text, p_name text, p_cell text) RETURNS TABLE(success boolean, error text)
    LANGUAGE plpgsql
    AS $_$

DECLARE

  v_user_id UUID;

BEGIN

  -- Validate phone format (XXX-XXX-XXXX)

  IF p_cell !~ '^\d{3}-\d{3}-\d{4}$' THEN

    RETURN QUERY SELECT FALSE, 'Invalid phone number format. Use XXX-XXX-XXXX format.';

    RETURN;

  END IF;



  -- Check if user exists

  SELECT id INTO v_user_id FROM users WHERE email = p_email;



  IF NOT FOUND THEN

    RETURN QUERY SELECT FALSE, 'User not found.';

    RETURN;

  END IF;



  -- Update

  UPDATE users

  SET name = p_name, cell = p_cell

  WHERE email = p_email;



  RETURN QUERY SELECT TRUE, NULL;

END;

$_$;


--
-- Name: verify_user_code(text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verify_user_code(p_email text, p_code integer) RETURNS TABLE(success boolean, error text, user_id uuid)
    LANGUAGE plpgsql
    AS $$

DECLARE
  v_key INT;
  v_created_at TIMESTAMP;
  v_diff_minutes DOUBLE PRECISION;
  v_user_id UUID;
BEGIN
  SELECT key, created_at INTO v_key, v_created_at
  FROM codes
  WHERE email = p_email;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Code not found.', NULL::UUID;
    RETURN;
  END IF;

  IF v_key <> p_code THEN
    RETURN QUERY SELECT FALSE, 'Invalid code.', NULL::UUID;
    RETURN;
  END IF;

  v_diff_minutes := EXTRACT(EPOCH FROM (NOW() - v_created_at)) / 60.0;

  IF v_diff_minutes > 10 THEN
    RETURN QUERY SELECT FALSE, 'Code has expired.', NULL::UUID;
    RETURN;
  END IF;

  -- Create user if not exists and get the ID
  INSERT INTO users (email)
  VALUES (p_email)
  ON CONFLICT (email) DO NOTHING;
  
  -- Get the user ID
  SELECT id INTO v_user_id FROM users WHERE email = p_email;

  -- Delete the code
  DELETE FROM codes WHERE email = p_email;

  RETURN QUERY SELECT TRUE, NULL, v_user_id;
END;
$$;


--
-- Name: update_order_status(uuid, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_order_status(p_order_id uuid, p_is_open boolean) RETURNS TABLE(success boolean, error text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    -- Check if order exists
    SELECT EXISTS(SELECT 1 FROM food_orders WHERE id = p_order_id) INTO v_exists;

    IF NOT v_exists THEN
        RETURN QUERY SELECT FALSE, 'Order not found';
        RETURN;
    END IF;

    -- Update order status
    UPDATE food_orders 
    SET is_open = p_is_open 
    WHERE id = p_order_id;

    RETURN QUERY SELECT TRUE, NULL;
END;
$$;


--
-- Name: get_order_details(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_order_details(p_order_id uuid) 
RETURNS TABLE(
  success boolean, 
  error text,
  order_details JSON
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if order exists
  IF NOT EXISTS (SELECT 1 FROM food_orders WHERE id = p_order_id) THEN
    RETURN QUERY SELECT FALSE, 'Order not found'::text, NULL::JSON;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    TRUE,
    NULL::text,
    (
      SELECT row_to_json(order_info)
      FROM (
        SELECT
          fo.id,
          fo.owner_id,
          fo.restaurant,
          fo.expiration,
          fo.location,
          fo.is_open,
          (
            SELECT json_agg(participant_info)
            FROM (
              SELECT 
                u.id,
                u.name,
                u.cell,
                u.email,
                CASE WHEN u.id = fo.owner_id THEN TRUE ELSE FALSE END as is_owner
              FROM order_groups og
              JOIN users u ON og.user_id = u.id
              WHERE og.food_order_id = fo.id
              ORDER BY 
                CASE WHEN u.id = fo.owner_id THEN 0 ELSE 1 END,
                og.created_at
            ) participant_info
          ) as participants
        FROM food_orders fo
        WHERE fo.id = p_order_id
      ) order_info
    );
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codes (
    email text NOT NULL,
    key integer,
    expiration timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: food_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.food_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid,
    is_open boolean DEFAULT true,
    size integer DEFAULT 1,
    expiration timestamp without time zone,
    started_at timestamp without time zone,
    location public.locs,
    restaurant text DEFAULT 'flexible'::text NOT NULL
);


--
-- Name: order_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    food_order_id uuid,
    user_id uuid,
    created_at time without time zone
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text,
    cell character varying,
    email text NOT NULL
);


--
-- Name: codes codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codes
    ADD CONSTRAINT codes_pkey PRIMARY KEY (email);


--
-- Name: food_orders food_order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_orders
    ADD CONSTRAINT food_order_pkey PRIMARY KEY (id);


--
-- Name: order_groups order_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_groups
    ADD CONSTRAINT order_groups_pkey PRIMARY KEY (id);


--
-- Name: users user_cell_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT user_cell_key UNIQUE (cell);


--
-- Name: users user_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: users user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: food_orders food_order_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_orders
    ADD CONSTRAINT food_order_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: order_groups order_groups_food_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_groups
    ADD CONSTRAINT order_groups_food_order_id_fkey FOREIGN KEY (food_order_id) REFERENCES public.food_orders(id);


--
-- Name: order_groups order_groups_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_groups
    ADD CONSTRAINT order_groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

