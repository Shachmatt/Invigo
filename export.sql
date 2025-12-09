--
-- PostgreSQL database dump
--

\restrict gGzFTRClhJaByKY6ranggQuY6pazxzjSQ1O5BvjAwlp2NcBJR5iMbG81WHyFAEA

-- Dumped from database version 15.4
-- Dumped by pg_dump version 18.1

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: exercise_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exercise_data (
    id integer NOT NULL,
    exercise_id integer,
    data jsonb NOT NULL
);


ALTER TABLE public.exercise_data OWNER TO postgres;

--
-- Name: excercise_data_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.excercise_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.excercise_data_id_seq OWNER TO postgres;

--
-- Name: excercise_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.excercise_data_id_seq OWNED BY public.exercise_data.id;


--
-- Name: exercises; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exercises (
    id integer NOT NULL,
    lesson_id integer,
    type character varying NOT NULL,
    question text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.exercises OWNER TO postgres;

--
-- Name: excercises_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.excercises_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.excercises_id_seq OWNER TO postgres;

--
-- Name: excercises_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.excercises_id_seq OWNED BY public.exercises.id;


--
-- Name: lessons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lessons (
    id integer NOT NULL,
    title character varying NOT NULL,
    intro text,
    before_exercise text,
    outro text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    section_id integer NOT NULL
);


ALTER TABLE public.lessons OWNER TO postgres;

--
-- Name: lessons_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lessons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lessons_id_seq OWNER TO postgres;

--
-- Name: lessons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lessons_id_seq OWNED BY public.lessons.id;


--
-- Name: sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sections (
    id integer NOT NULL,
    super_lesson_id integer NOT NULL,
    title text NOT NULL,
    "position" integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.sections OWNER TO postgres;

--
-- Name: sections_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sections_id_seq OWNER TO postgres;

--
-- Name: sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sections_id_seq OWNED BY public.sections.id;


--
-- Name: superlessons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.superlessons (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.superlessons OWNER TO postgres;

--
-- Name: superlessons_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.superlessons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.superlessons_id_seq OWNER TO postgres;

--
-- Name: superlessons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.superlessons_id_seq OWNED BY public.superlessons.id;


--
-- Name: exercise_data id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise_data ALTER COLUMN id SET DEFAULT nextval('public.excercise_data_id_seq'::regclass);


--
-- Name: exercises id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercises ALTER COLUMN id SET DEFAULT nextval('public.excercises_id_seq'::regclass);


--
-- Name: lessons id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lessons ALTER COLUMN id SET DEFAULT nextval('public.lessons_id_seq'::regclass);


--
-- Name: sections id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections ALTER COLUMN id SET DEFAULT nextval('public.sections_id_seq'::regclass);


--
-- Name: superlessons id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.superlessons ALTER COLUMN id SET DEFAULT nextval('public.superlessons_id_seq'::regclass);


--
-- Data for Name: exercise_data; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exercise_data (id, exercise_id, data) FROM stdin;
6	6	{"options": ["Bitcoin", "Koruna česká", "Koruna česká (politický subjekt)", "Koruna česká (pokrývka hlavy)"], "correct_index": 0}
7	7	{"labels": ["Krypto", "Klasická měna", "akcie"], "options": ["Bitcoin", "Koruna", "Microsoft"]}
8	8	{"correct": "hodně", "typeResult": "text"}
\.


--
-- Data for Name: exercises; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exercises (id, lesson_id, type, question, created_at) FROM stdin;
6	3	Question	Co z tohohle je kryptoměna?	2025-12-09 11:46:37.928819
7	3	MatchExcercise	Přiřaď k sobě	2025-12-09 11:46:37.928819
8	3	Calc	Kolik korun stojí jeden bitcoin?	2025-12-09 11:46:37.928819
\.


--
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lessons (id, title, intro, before_exercise, outro, created_at, updated_at, section_id) FROM stdin;
3	Úvod do krypta		V této sekci se naučíme spoustu zajímavých věcí	v této sekci jsme se naučili spoustu zajímavých věcí	2025-12-09 11:46:37.928819	2025-12-09 11:46:37.928819	2
\.


--
-- Data for Name: sections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sections (id, super_lesson_id, title, "position", created_at, updated_at) FROM stdin;
2	1	Krypto	\N	2025-12-09 11:35:44.906818+01	2025-12-09 11:35:44.906818+01
\.


--
-- Data for Name: superlessons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.superlessons (id, title, description, created_at, updated_at) FROM stdin;
1	Základy neinvestování	naučí tě základům neinvestování	2025-12-09 11:24:10.009422+01	2025-12-09 11:27:45.499429+01
\.


--
-- Name: excercise_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.excercise_data_id_seq', 8, true);


--
-- Name: excercises_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.excercises_id_seq', 8, true);


--
-- Name: lessons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lessons_id_seq', 3, true);


--
-- Name: sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sections_id_seq', 2, true);


--
-- Name: superlessons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.superlessons_id_seq', 1, true);


--
-- Name: exercise_data excercise_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise_data
    ADD CONSTRAINT excercise_data_pkey PRIMARY KEY (id);


--
-- Name: exercises excercises_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT excercises_pkey PRIMARY KEY (id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: sections sections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_pkey PRIMARY KEY (id);


--
-- Name: superlessons superlessons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.superlessons
    ADD CONSTRAINT superlessons_pkey PRIMARY KEY (id);


--
-- Name: exercise_data excercise_data_excercise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise_data
    ADD CONSTRAINT excercise_data_excercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE;


--
-- Name: exercises excercises_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT excercises_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: lessons lessons_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE CASCADE;


--
-- Name: sections sections_super_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_super_lesson_id_fkey FOREIGN KEY (super_lesson_id) REFERENCES public.superlessons(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict gGzFTRClhJaByKY6ranggQuY6pazxzjSQ1O5BvjAwlp2NcBJR5iMbG81WHyFAEA

