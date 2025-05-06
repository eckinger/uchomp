--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4 (Postgres.app)
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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: order_groups; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.order_groups (
    order_id integer NOT NULL,
    user_id integer,
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
-- Name: code; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.code (
    email text NOT NULL,
    key integer,
    expiration time without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.code OWNER TO neondb_owner;

--
-- Name: food_orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.food_orders (
    id integer NOT NULL,
    owner_id integer,
    is_open boolean DEFAULT true,
    size integer DEFAULT 1,
    expiration time without time zone,
    started_at timestamp without time zone,
    location public.locs,
    restaurant text DEFAULT 'flexible'::text NOT NULL
);


ALTER TABLE public.food_orders OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    name text,
    cell character varying,
    email text NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: code code_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.code
    ADD CONSTRAINT code_pkey PRIMARY KEY (email);


--
-- Name: food_orders food_order_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.food_orders
    ADD CONSTRAINT food_order_pkey PRIMARY KEY (id);


--
-- Name: order_groups order_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_groups
    ADD CONSTRAINT order_groups_pkey PRIMARY KEY (order_id);


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
-- Name: order_groups order_groups_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_groups
    ADD CONSTRAINT order_groups_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.food_orders(id);


--
-- Name: order_groups order_groups_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_groups
    ADD CONSTRAINT order_groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

