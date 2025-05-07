--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4 (Debian 17.4-1.pgdg120+2)
-- Dumped by pg_dump version 17.4 (Postgres.app)

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
-- Name: locs; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.locs AS ENUM (
    'Regenstein Library',
    'Harper Library',
    'John Crerar Library'
);


ALTER TYPE public.locs OWNER TO neondb_owner;

--
-- Name: create_food_order(uuid, text, timestamp with time zone, public.locs); Type: FUNCTION; Schema: public; Owner: postgres
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

  RETURN QUERY SELECT TRUE, order_id, NULL;
END;
$$;


ALTER FUNCTION public.create_food_order(p_owner_id uuid, p_restaurant text, p_expiration timestamp with time zone, p_location public.locs) OWNER TO postgres;

--
-- Name: create_verification_code(text, integer); Type: PROCEDURE; Schema: public; Owner: postgres
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


ALTER PROCEDURE public.create_verification_code(IN p_email text, IN p_key integer) OWNER TO postgres;

--
-- Name: delete_order(uuid); Type: FUNCTION; Schema: public; Owner: postgres
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

  -- Delete from food_orders
  DELETE FROM food_orders WHERE id = p_order_id;

  RETURN QUERY SELECT TRUE, NULL;
END;
$$;


ALTER FUNCTION public.delete_order(p_order_id uuid) OWNER TO postgres;

--
-- Name: ensure_user_exists(text); Type: PROCEDURE; Schema: public; Owner: postgres
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


ALTER PROCEDURE public.ensure_user_exists(IN p_email text) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: order_groups; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.order_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    created_at time without time zone
);


ALTER TABLE public.order_groups OWNER TO neondb_owner;

--
-- Name: get_orders(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_orders() RETURNS SETOF public.order_groups
    LANGUAGE sql
    AS $$
SELECT * FROM order_groups;
$$;


ALTER FUNCTION public.get_orders() OWNER TO postgres;

--
-- Name: FUNCTION get_orders(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_orders() IS 'Fetches the orders';


--
-- Name: update_name_and_cell(text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.update_name_and_cell(p_email text, p_name text, p_cell text) OWNER TO postgres;

--
-- Name: verify_user_code(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.verify_user_code(p_email text, p_code integer) RETURNS TABLE(success boolean, error text)
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_key INT;
  v_created_at TIMESTAMP;
  v_diff_minutes DOUBLE PRECISION;
BEGIN
  SELECT key, created_at INTO v_key, v_created_at
  FROM codes
  WHERE email = p_email;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Code not found.';
    RETURN;
  END IF;

  IF v_key <> p_code THEN
    RETURN QUERY SELECT FALSE, 'Invalid code.';
    RETURN;
  END IF;

  v_diff_minutes := EXTRACT(EPOCH FROM (NOW() - v_created_at)) / 60.0;

  IF v_diff_minutes > 10 THEN
    RETURN QUERY SELECT FALSE, 'Code has expired.';
    RETURN;
  END IF;

  -- Create user if not exists
  INSERT INTO users (email)
  VALUES (p_email)
  ON CONFLICT (email) DO NOTHING;

  -- Delete the code
  DELETE FROM codes WHERE email = p_email;

  RETURN QUERY SELECT TRUE, NULL;
END;
$$;


ALTER FUNCTION public.verify_user_code(p_email text, p_code integer) OWNER TO postgres;

--
-- Name: codes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.codes (
    email text NOT NULL,
    key integer,
    expiration timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.codes OWNER TO neondb_owner;

--
-- Name: food_orders; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.food_orders OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text,
    cell character varying,
    email text NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: codes codes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.codes
    ADD CONSTRAINT codes_pkey PRIMARY KEY (email);


--
-- Name: food_orders food_order_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.food_orders
    ADD CONSTRAINT food_order_pkey PRIMARY KEY (id);


--
-- Name: order_groups order_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_groups
    ADD CONSTRAINT order_groups_pkey PRIMARY KEY (id);


--
-- Name: users user_cell_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT user_cell_key UNIQUE (cell);


--
-- Name: users user_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: users user_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: food_orders food_order_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.food_orders
    ADD CONSTRAINT food_order_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: order_groups order_groups_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_groups
    ADD CONSTRAINT order_groups_id_fkey FOREIGN KEY (id) REFERENCES public.food_orders(id);


--
-- Name: order_groups order_groups_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_groups
    ADD CONSTRAINT order_groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--
