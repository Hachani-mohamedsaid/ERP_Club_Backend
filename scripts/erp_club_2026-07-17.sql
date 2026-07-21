--
-- PostgreSQL database dump
--

\restrict t1XVALM72cZPHoQEwH0kbwwV5l54JcJo11zQqRgCL6EkRS40iHfTaJgzX25kCso

-- Dumped from database version 18.4 (Debian 18.4-1.pgdg12+1)
-- Dumped by pg_dump version 18.4 (Debian 18.4-1.pgdg12+1)

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: erp_admin
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO erp_admin;

--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: erp_admin
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


--
-- Name: AuditActionType; Type: TYPE; Schema: public; Owner: erp_admin
--

CREATE TYPE "public"."AuditActionType" AS ENUM (
    'CONNEXION',
    'CREATION',
    'MODIFICATION',
    'SUPPRESSION',
    'EXPORT',
    'PERMISSION'
);


ALTER TYPE public."AuditActionType" OWNER TO erp_admin;

--
-- Name: CalendarEventType; Type: TYPE; Schema: public; Owner: erp_admin
--

CREATE TYPE "public"."CalendarEventType" AS ENUM (
    'MATCH',
    'ENTRAINEMENT',
    'MEDICAL',
    'REUNION',
    'RECUPERATION',
    'SCOUT'
);


ALTER TYPE public."CalendarEventType" OWNER TO erp_admin;

--
-- Name: ClubMemberRole; Type: TYPE; Schema: public; Owner: erp_admin
--

CREATE TYPE "public"."ClubMemberRole" AS ENUM (
    'CLUB_ADMIN',
    'COACH',
    'MEDECIN',
    'RESPONSABLE_FINANCIER',
    'SCOUT',
    'ANALYSTE',
    'RESPONSABLE',
    'PREPARATEUR',
    'RECRUTEUR',
    'JOUEUR'
);


ALTER TYPE public."ClubMemberRole" OWNER TO erp_admin;

--
-- Name: DocumentCategory; Type: TYPE; Schema: public; Owner: erp_admin
--

CREATE TYPE "public"."DocumentCategory" AS ENUM (
    'CONTRAT_PDF',
    'RAPPORT_PDF',
    'MEDICAL',
    'LICENCE'
);


ALTER TYPE public."DocumentCategory" OWNER TO erp_admin;

--
-- Name: DocumentStatus; Type: TYPE; Schema: public; Owner: erp_admin
--

CREATE TYPE "public"."DocumentStatus" AS ENUM (
    'VALIDE',
    'EXPIRE',
    'EN_REVISION'
);


ALTER TYPE public."DocumentStatus" OWNER TO erp_admin;

--
-- Name: ExpenseRequestStatus; Type: TYPE; Schema: public; Owner: erp_admin
--

CREATE TYPE "public"."ExpenseRequestStatus" AS ENUM (
    'EN_ATTENTE',
    'APPROUVEE',
    'REFUSEE'
);


ALTER TYPE public."ExpenseRequestStatus" OWNER TO erp_admin;

--
-- Name: FinanceEntryType; Type: TYPE; Schema: public; Owner: erp_admin
--

CREATE TYPE "public"."FinanceEntryType" AS ENUM (
    'REVENUE',
    'EXPENSE'
);


ALTER TYPE public."FinanceEntryType" OWNER TO erp_admin;

--
-- Name: MemberStatus; Type: TYPE; Schema: public; Owner: erp_admin
--

CREATE TYPE "public"."MemberStatus" AS ENUM (
    'ACTIF',
    'INACTIF',
    'SUSPENDU'
);


ALTER TYPE public."MemberStatus" OWNER TO erp_admin;

--
-- Name: NotifLevel; Type: TYPE; Schema: public; Owner: erp_admin
--

CREATE TYPE "public"."NotifLevel" AS ENUM (
    'CRITICAL',
    'WARNING',
    'INFO',
    'SUCCESS'
);


ALTER TYPE public."NotifLevel" OWNER TO erp_admin;

--
-- Name: NotifType; Type: TYPE; Schema: public; Owner: erp_admin
--

CREATE TYPE "public"."NotifType" AS ENUM (
    'CONTRATS',
    'FINANCE',
    'MEDICAL',
    'SYSTEME',
    'INFO'
);


ALTER TYPE public."NotifType" OWNER TO erp_admin;

--
-- Name: OrganizationStatus; Type: TYPE; Schema: public; Owner: erp_admin
--

CREATE TYPE "public"."OrganizationStatus" AS ENUM (
    'TRIAL',
    'ACTIVE',
    'SUSPENDED',
    'CANCELLED'
);


ALTER TYPE public."OrganizationStatus" OWNER TO erp_admin;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: erp_admin
--

CREATE TYPE "public"."PaymentStatus" AS ENUM (
    'PENDING',
    'PAID',
    'FAILED',
    'REFUNDED'
);


ALTER TYPE public."PaymentStatus" OWNER TO erp_admin;

--
-- Name: PlayerStatus; Type: TYPE; Schema: public; Owner: erp_admin
--

CREATE TYPE "public"."PlayerStatus" AS ENUM (
    'DISPONIBLE',
    'BLESSE',
    'LIMITE',
    'FIN_CONTRAT'
);


ALTER TYPE public."PlayerStatus" OWNER TO erp_admin;

--
-- Name: RecruitmentStatus; Type: TYPE; Schema: public; Owner: erp_admin
--

CREATE TYPE "public"."RecruitmentStatus" AS ENUM (
    'NON_TRAITE',
    'EN_OBSERVATION',
    'SHORTLISTE',
    'CONTACTE',
    'REFUSE'
);


ALTER TYPE public."RecruitmentStatus" OWNER TO erp_admin;

--
-- Name: RecruteurAuditAction; Type: TYPE; Schema: public; Owner: erp_admin
--

CREATE TYPE "public"."RecruteurAuditAction" AS ENUM (
    'VALIDATION',
    'OFFRE',
    'CONTRAT',
    'TRANSFERT',
    'MODIFICATION',
    'CREATION',
    'SUPPRESSION',
    'CONNEXION'
);


ALTER TYPE public."RecruteurAuditAction" OWNER TO erp_admin;

--
-- Name: RecruteurAuditSeverity; Type: TYPE; Schema: public; Owner: erp_admin
--

CREATE TYPE "public"."RecruteurAuditSeverity" AS ENUM (
    'INFO',
    'SUCCESS',
    'WARNING',
    'CRITICAL'
);


ALTER TYPE public."RecruteurAuditSeverity" OWNER TO erp_admin;

--
-- Name: RecruteurCalendarEventType; Type: TYPE; Schema: public; Owner: erp_admin
--

CREATE TYPE "public"."RecruteurCalendarEventType" AS ENUM (
    'MATCH',
    'AGENT',
    'VALIDATION',
    'CONTRAT',
    'DEPLACEMENT'
);


ALTER TYPE public."RecruteurCalendarEventType" OWNER TO erp_admin;

--
-- Name: SubscriptionStatus; Type: TYPE; Schema: public; Owner: erp_admin
--

CREATE TYPE "public"."SubscriptionStatus" AS ENUM (
    'TRIALING',
    'ACTIVE',
    'PAST_DUE',
    'CANCELLED',
    'EXPIRED'
);


ALTER TYPE public."SubscriptionStatus" OWNER TO erp_admin;

--
-- Name: SupportTicketPriority; Type: TYPE; Schema: public; Owner: erp_admin
--

CREATE TYPE "public"."SupportTicketPriority" AS ENUM (
    'CRITICAL',
    'HIGH',
    'NORMAL'
);


ALTER TYPE public."SupportTicketPriority" OWNER TO erp_admin;

--
-- Name: SupportTicketStatus; Type: TYPE; Schema: public; Owner: erp_admin
--

CREATE TYPE "public"."SupportTicketStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED'
);


ALTER TYPE public."SupportTicketStatus" OWNER TO erp_admin;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: erp_admin
--

CREATE TYPE "public"."UserRole" AS ENUM (
    'ADMIN_CLUB',
    'SUPER_ADMIN'
);


ALTER TYPE public."UserRole" OWNER TO erp_admin;

--
-- Name: ValidationPriority; Type: TYPE; Schema: public; Owner: erp_admin
--

CREATE TYPE "public"."ValidationPriority" AS ENUM (
    'CRITIQUE',
    'HAUTE',
    'NORMALE'
);


ALTER TYPE public."ValidationPriority" OWNER TO erp_admin;

--
-- Name: ValidationRequestStatus; Type: TYPE; Schema: public; Owner: erp_admin
--

CREATE TYPE "public"."ValidationRequestStatus" AS ENUM (
    'EN_ATTENTE',
    'VALIDE',
    'REFUSE',
    'RETOUR'
);


ALTER TYPE public."ValidationRequestStatus" OWNER TO erp_admin;

--
-- Name: ValidationRequestType; Type: TYPE; Schema: public; Owner: erp_admin
--

CREATE TYPE "public"."ValidationRequestType" AS ENUM (
    'RECRUTEMENT',
    'CONTRAT',
    'BUDGET',
    'CONVOCATION',
    'MEDICAL'
);


ALTER TYPE public."ValidationRequestType" OWNER TO erp_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AnalysteModuleData; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."AnalysteModuleData" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "moduleKey" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AnalysteModuleData" OWNER TO erp_admin;

--
-- Name: BudgetCategory; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."BudgetCategory" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "name" "text" NOT NULL,
    "allocated" integer DEFAULT 0 NOT NULL,
    "spent" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."BudgetCategory" OWNER TO erp_admin;

--
-- Name: ClubAuditLog; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."ClubAuditLog" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "userName" "text" NOT NULL,
    "userRole" "text" NOT NULL,
    "action" "text" NOT NULL,
    "entity" "text" NOT NULL,
    "details" "text" NOT NULL,
    "type" "public"."AuditActionType" NOT NULL,
    "ipAddress" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ClubAuditLog" OWNER TO erp_admin;

--
-- Name: ClubCalendarEvent; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."ClubCalendarEvent" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "title" "text" NOT NULL,
    "eventDate" timestamp(3) without time zone NOT NULL,
    "eventTime" "text",
    "eventType" "public"."CalendarEventType" DEFAULT 'ENTRAINEMENT'::"public"."CalendarEventType" NOT NULL,
    "location" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "extraData" "jsonb",
    "notes" "text"
);


ALTER TABLE public."ClubCalendarEvent" OWNER TO erp_admin;

--
-- Name: ClubContract; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."ClubContract" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "holderName" "text" NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "salaryMonthly" integer DEFAULT 0 NOT NULL,
    "bonus" integer DEFAULT 0 NOT NULL,
    "releaseClause" "text",
    "consumedPct" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ClubContract" OWNER TO erp_admin;

--
-- Name: ClubDashboardStats; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."ClubDashboardStats" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "playersCount" integer DEFAULT 0 NOT NULL,
    "staffCount" integer DEFAULT 0 NOT NULL,
    "budgetRemaining" integer DEFAULT 0 NOT NULL,
    "payrollTotal" integer DEFAULT 0 NOT NULL,
    "injuredCount" integer DEFAULT 0 NOT NULL,
    "contractsToRenew" integer DEFAULT 0 NOT NULL,
    "budgetUsedPct" integer DEFAULT 0 NOT NULL,
    "budgetChart" "jsonb" NOT NULL,
    "alerts" "jsonb" NOT NULL,
    "aiSummary" "jsonb" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ClubDashboardStats" OWNER TO erp_admin;

--
-- Name: ClubDirectConversation; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."ClubDirectConversation" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "participantAId" "text" NOT NULL,
    "participantBId" "text" NOT NULL,
    "lastMessageAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ClubDirectConversation" OWNER TO erp_admin;

--
-- Name: ClubDirectMessage; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."ClubDirectMessage" (
    "id" "text" NOT NULL,
    "conversationId" "text" NOT NULL,
    "senderMemberId" "text" NOT NULL,
    "body" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ClubDirectMessage" OWNER TO erp_admin;

--
-- Name: ClubDirectMessageRead; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."ClubDirectMessageRead" (
    "id" "text" NOT NULL,
    "messageId" "text" NOT NULL,
    "memberId" "text" NOT NULL,
    "readAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ClubDirectMessageRead" OWNER TO erp_admin;

--
-- Name: ClubDocument; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."ClubDocument" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "name" "text" NOT NULL,
    "category" "public"."DocumentCategory" NOT NULL,
    "playerName" "text",
    "fileUrl" "text",
    "sizeLabel" "text" DEFAULT '—'::"text" NOT NULL,
    "status" "public"."DocumentStatus" DEFAULT 'VALIDE'::"public"."DocumentStatus" NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "uploadedBy" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ClubDocument" OWNER TO erp_admin;

--
-- Name: ClubFinanceEntry; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."ClubFinanceEntry" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "label" "text" NOT NULL,
    "amount" integer NOT NULL,
    "type" "public"."FinanceEntryType" NOT NULL,
    "category" "text" NOT NULL,
    "entryDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ClubFinanceEntry" OWNER TO erp_admin;

--
-- Name: ClubInfrastructure; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."ClubInfrastructure" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "name" "text" NOT NULL,
    "infraType" "text" NOT NULL,
    "status" "text" DEFAULT 'Bon'::"text" NOT NULL,
    "capacity" "text",
    "occupationPct" integer DEFAULT 0 NOT NULL,
    "nextMaintenance" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ClubInfrastructure" OWNER TO erp_admin;

--
-- Name: ClubInjury; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."ClubInjury" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "playerName" "text" NOT NULL,
    "injuryType" "text" NOT NULL,
    "bodyPart" "text",
    "returnDate" timestamp(3) without time zone,
    "riskScore" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ClubInjury" OWNER TO erp_admin;

--
-- Name: ClubInvoice; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."ClubInvoice" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "reference" "text" NOT NULL,
    "fournisseur" "text" NOT NULL,
    "invoiceType" "text" DEFAULT 'Fournisseur'::"text" NOT NULL,
    "montant" integer DEFAULT 0 NOT NULL,
    "invoiceDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "dueDate" timestamp(3) without time zone,
    "status" "text" DEFAULT 'En attente'::"text" NOT NULL,
    "description" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ClubInvoice" OWNER TO erp_admin;

--
-- Name: ClubMaintenance; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."ClubMaintenance" (
    "id" "text" NOT NULL,
    "infrastructureId" "text" NOT NULL,
    "taskType" "text" NOT NULL,
    "scheduledDate" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ClubMaintenance" OWNER TO erp_admin;

--
-- Name: ClubMatch; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."ClubMatch" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "opponent" "text" NOT NULL,
    "competition" "text" DEFAULT 'Ligue 1'::"text" NOT NULL,
    "matchDate" timestamp(3) without time zone NOT NULL,
    "homeAway" "text" DEFAULT 'D'::"text" NOT NULL,
    "goalsFor" integer DEFAULT 0 NOT NULL,
    "goalsAgainst" integer DEFAULT 0 NOT NULL,
    "result" "text" DEFAULT 'N'::"text" NOT NULL,
    "opponentFormation" "text",
    "opponentStrengths" "text",
    "opponentWeaknesses" "text",
    "notes" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ClubMatch" OWNER TO erp_admin;

--
-- Name: ClubMember; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."ClubMember" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "fullName" "text" NOT NULL,
    "email" "text" NOT NULL,
    "clubRole" "public"."ClubMemberRole" DEFAULT 'COACH'::"public"."ClubMemberRole" NOT NULL,
    "status" "public"."MemberStatus" DEFAULT 'ACTIF'::"public"."MemberStatus" NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clubPlayerId" "text"
);


ALTER TABLE public."ClubMember" OWNER TO erp_admin;

--
-- Name: ClubNotification; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."ClubNotification" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "type" "public"."NotifType" DEFAULT 'INFO'::"public"."NotifType" NOT NULL,
    "level" "public"."NotifLevel" DEFAULT 'INFO'::"public"."NotifLevel" NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "sourceKey" "text",
    "path" "text",
    "iconKey" "text"
);


ALTER TABLE public."ClubNotification" OWNER TO erp_admin;

--
-- Name: ClubPermission; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."ClubPermission" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "module" "text" NOT NULL,
    "clubRole" "public"."ClubMemberRole" NOT NULL,
    "canRead" boolean DEFAULT false NOT NULL,
    "canCreate" boolean DEFAULT false NOT NULL,
    "canUpdate" boolean DEFAULT false NOT NULL,
    "canDelete" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."ClubPermission" OWNER TO erp_admin;

--
-- Name: ClubPlayer; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."ClubPlayer" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "fullName" "text" NOT NULL,
    "position" "text" NOT NULL,
    "age" integer DEFAULT 0 NOT NULL,
    "ovr" integer DEFAULT 0 NOT NULL,
    "marketValue" "text" DEFAULT '0'::"text" NOT NULL,
    "salaryMonthly" integer DEFAULT 0 NOT NULL,
    "status" "public"."PlayerStatus" DEFAULT 'DISPONIBLE'::"public"."PlayerStatus" NOT NULL,
    "radar" "jsonb",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "goals" integer DEFAULT 0 NOT NULL,
    "photoUrl" "text",
    "stats" "jsonb",
    "birthDate" "text",
    "height" "text",
    "jerseyNumber" integer DEFAULT 0,
    "nationality" "text" DEFAULT 'Tunisie'::"text",
    "strongFoot" "text" DEFAULT 'Droit'::"text",
    "weight" "text"
);


ALTER TABLE public."ClubPlayer" OWNER TO erp_admin;

--
-- Name: ClubSponsor; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."ClubSponsor" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "nom" "text" NOT NULL,
    "logo" "text" DEFAULT '🤝'::"text" NOT NULL,
    "secteur" "text" DEFAULT 'Partenaire'::"text" NOT NULL,
    "montant" integer DEFAULT 0 NOT NULL,
    "startDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "renewalProbability" integer DEFAULT 50 NOT NULL,
    "status" "text" DEFAULT 'Actif'::"text" NOT NULL,
    "contact" "text",
    "notes" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ClubSponsor" OWNER TO erp_admin;

--
-- Name: ClubStaff; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."ClubStaff" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "fullName" "text" NOT NULL,
    "role" "text" NOT NULL,
    "salaryMonthly" integer DEFAULT 0 NOT NULL,
    "contractEnd" timestamp(3) without time zone,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "phone" "text",
    "department" "text"
);


ALTER TABLE public."ClubStaff" OWNER TO erp_admin;

--
-- Name: ClubStanding; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."ClubStanding" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "competition" "text" DEFAULT 'Ligue 1'::"text" NOT NULL,
    "position" integer DEFAULT 1 NOT NULL,
    "points" integer DEFAULT 0 NOT NULL,
    "played" integer DEFAULT 0 NOT NULL,
    "won" integer DEFAULT 0 NOT NULL,
    "drawn" integer DEFAULT 0 NOT NULL,
    "lost" integer DEFAULT 0 NOT NULL,
    "goalsFor" integer DEFAULT 0 NOT NULL,
    "goalsAgainst" integer DEFAULT 0 NOT NULL,
    "form" "text" DEFAULT ''::"text" NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ClubStanding" OWNER TO erp_admin;

--
-- Name: ExpenseRequest; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."ExpenseRequest" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "categoryId" "text",
    "label" "text" NOT NULL,
    "amount" integer NOT NULL,
    "requestedBy" "text" NOT NULL,
    "status" "public"."ExpenseRequestStatus" DEFAULT 'EN_ATTENTE'::"public"."ExpenseRequestStatus" NOT NULL,
    "note" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ExpenseRequest" OWNER TO erp_admin;

--
-- Name: InjuryRisk; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."InjuryRisk" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "playerId" "text" NOT NULL,
    "zone" "text" NOT NULL,
    "risk" integer DEFAULT 50 NOT NULL,
    "recommendation" "text"[],
    "medicalComment" "text",
    "medicalAuthor" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."InjuryRisk" OWNER TO erp_admin;

--
-- Name: InvitationCode; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."InvitationCode" (
    "id" "text" NOT NULL,
    "code" "text" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "maxUses" integer,
    "usedCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."InvitationCode" OWNER TO erp_admin;

--
-- Name: MatchReadiness; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."MatchReadiness" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "playerId" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."MatchReadiness" OWNER TO erp_admin;

--
-- Name: Organization; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."Organization" (
    "id" "text" NOT NULL,
    "clubName" "text" NOT NULL,
    "country" "text" NOT NULL,
    "league" "text" NOT NULL,
    "logoUrl" "text",
    "invitationCode" "text",
    "ownerId" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "status" "public"."OrganizationStatus" DEFAULT 'TRIAL'::"public"."OrganizationStatus" NOT NULL,
    "trialEndsAt" timestamp(3) without time zone
);


ALTER TABLE public."Organization" OWNER TO erp_admin;

--
-- Name: OrganizationProfile; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."OrganizationProfile" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "abbreviation" "text",
    "officialEmail" "text",
    "phone" "text",
    "website" "text",
    "stadium" "text",
    "address" "text",
    "city" "text",
    "primaryColor" "text" DEFAULT '#FF6B57'::"text" NOT NULL,
    "secondaryColor" "text" DEFAULT '#070B1F'::"text" NOT NULL,
    "notifyEmail" boolean DEFAULT true NOT NULL,
    "notifySms" boolean DEFAULT false NOT NULL,
    "notifyPush" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OrganizationProfile" OWNER TO erp_admin;

--
-- Name: OrganizationSubscription; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."OrganizationSubscription" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "planId" "text" NOT NULL,
    "status" "public"."SubscriptionStatus" DEFAULT 'TRIALING'::"public"."SubscriptionStatus" NOT NULL,
    "trialEndsAt" timestamp(3) without time zone,
    "currentPeriodStart" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "currentPeriodEnd" timestamp(3) without time zone NOT NULL,
    "cancelledAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OrganizationSubscription" OWNER TO erp_admin;

--
-- Name: Plan; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."Plan" (
    "id" "text" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "priceMonthly" integer NOT NULL,
    "currency" "text" DEFAULT 'TND'::"text" NOT NULL,
    "features" "text"[],
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Plan" OWNER TO erp_admin;

--
-- Name: PlatformBlockedIp; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."PlatformBlockedIp" (
    "id" "text" NOT NULL,
    "ipAddress" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "country" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PlatformBlockedIp" OWNER TO erp_admin;

--
-- Name: PlatformPayment; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."PlatformPayment" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "invoiceNumber" "text" NOT NULL,
    "amount" integer NOT NULL,
    "currency" "text" DEFAULT 'TND'::"text" NOT NULL,
    "method" "text",
    "status" "public"."PaymentStatus" DEFAULT 'PENDING'::"public"."PaymentStatus" NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "periodStart" timestamp(3) without time zone,
    "periodEnd" timestamp(3) without time zone,
    "notes" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PlatformPayment" OWNER TO erp_admin;

--
-- Name: PlatformSettings; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."PlatformSettings" (
    "id" "text" DEFAULT 'default'::"text" NOT NULL,
    "platformName" "text" DEFAULT 'ODIN ERP'::"text" NOT NULL,
    "platformUrl" "text" DEFAULT 'https://odin.erp.tn'::"text" NOT NULL,
    "contactEmail" "text" DEFAULT 'admin@odin.erp.tn'::"text" NOT NULL,
    "supportPhone" "text" DEFAULT '+216 71 000 000'::"text" NOT NULL,
    "timezone" "text" DEFAULT 'Africa/Tunis'::"text" NOT NULL,
    "defaultLanguage" "text" DEFAULT 'fr'::"text" NOT NULL,
    "currency" "text" DEFAULT 'TND'::"text" NOT NULL,
    "maintenanceMode" boolean DEFAULT false NOT NULL,
    "openRegistration" boolean DEFAULT true NOT NULL,
    "debugMode" boolean DEFAULT false NOT NULL,
    "trialDays" integer DEFAULT 14 NOT NULL,
    "extendedSettings" "jsonb",
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PlatformSettings" OWNER TO erp_admin;

--
-- Name: PlatformSupportTicket; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."PlatformSupportTicket" (
    "id" "text" NOT NULL,
    "ticketNumber" "text" NOT NULL,
    "organizationId" "text",
    "clubName" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "description" "text",
    "priority" "public"."SupportTicketPriority" DEFAULT 'NORMAL'::"public"."SupportTicketPriority" NOT NULL,
    "status" "public"."SupportTicketStatus" DEFAULT 'OPEN'::"public"."SupportTicketStatus" NOT NULL,
    "agentName" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PlatformSupportTicket" OWNER TO erp_admin;

--
-- Name: PlayerAward; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."PlayerAward" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "playerId" "text" NOT NULL,
    "title" "text" NOT NULL,
    "season" "text" NOT NULL,
    "icon" "text" DEFAULT '🏆'::"text" NOT NULL,
    "color" "text" DEFAULT '#d99a1f'::"text" NOT NULL,
    "awardType" "text" DEFAULT 'award'::"text" NOT NULL,
    "year" "text",
    "club" "text",
    "event" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PlayerAward" OWNER TO erp_admin;

--
-- Name: PlayerChemistry; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."PlayerChemistry" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "player1Id" "text" NOT NULL,
    "player1Name" "text" NOT NULL,
    "player2Id" "text" NOT NULL,
    "player2Name" "text" NOT NULL,
    "chemistry" integer DEFAULT 75 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PlayerChemistry" OWNER TO erp_admin;

--
-- Name: PlayerDocument; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."PlayerDocument" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "playerId" "text" NOT NULL,
    "name" "text" NOT NULL,
    "docType" "text" DEFAULT 'Personnel'::"text" NOT NULL,
    "docDate" "text" NOT NULL,
    "size" "text" NOT NULL,
    "fileData" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PlayerDocument" OWNER TO erp_admin;

--
-- Name: PlayerLoad; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."PlayerLoad" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "playerId" "text" NOT NULL,
    "sessionDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "loadScore" integer DEFAULT 50 NOT NULL,
    "fatigueScore" integer DEFAULT 30 NOT NULL,
    "recoveryScore" integer DEFAULT 70 NOT NULL,
    "sessionType" "text" DEFAULT 'ENTRAINEMENT'::"text" NOT NULL,
    "notes" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PlayerLoad" OWNER TO erp_admin;

--
-- Name: PlayerMatchStat; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."PlayerMatchStat" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "playerId" "text" NOT NULL,
    "matchDate" timestamp(3) without time zone NOT NULL,
    "opponent" "text" NOT NULL,
    "result" "text" DEFAULT ''::"text" NOT NULL,
    "goals" integer DEFAULT 0 NOT NULL,
    "assists" integer DEFAULT 0 NOT NULL,
    "minutes" integer DEFAULT 90 NOT NULL,
    "rating" double precision DEFAULT 6.0 NOT NULL,
    "distance" double precision DEFAULT 0 NOT NULL,
    "sprints" integer DEFAULT 0 NOT NULL,
    "passAccuracy" integer DEFAULT 0 NOT NULL,
    "topSpeed" double precision DEFAULT 0 NOT NULL,
    "keyPasses" integer DEFAULT 0 NOT NULL,
    "heatmapData" "jsonb",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "redCards" integer DEFAULT 0 NOT NULL,
    "yellowCards" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."PlayerMatchStat" OWNER TO erp_admin;

--
-- Name: PlayerTransfer; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."PlayerTransfer" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "playerName" "text" NOT NULL,
    "transferType" "text" NOT NULL,
    "club" "text" NOT NULL,
    "value" "text" NOT NULL,
    "status" "text" NOT NULL,
    "probability" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PlayerTransfer" OWNER TO erp_admin;

--
-- Name: PrepNotification; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."PrepNotification" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "priority" "text" DEFAULT 'basse'::"text" NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "playerName" "text",
    "sourceType" "text",
    "sourceId" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PrepNotification" OWNER TO erp_admin;

--
-- Name: RecoverySession; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."RecoverySession" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "playerId" "text" NOT NULL,
    "method" "text" DEFAULT 'Repos'::"text" NOT NULL,
    "sessionDate" timestamp(3) without time zone NOT NULL,
    "duration" "text" DEFAULT '30 min'::"text" NOT NULL,
    "status" "text" DEFAULT 'Planifié'::"text" NOT NULL,
    "notes" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RecoverySession" OWNER TO erp_admin;

--
-- Name: RecruitmentProspect; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."RecruitmentProspect" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "fullName" "text" NOT NULL,
    "age" integer DEFAULT 0 NOT NULL,
    "position" "text" NOT NULL,
    "externalClub" "text" DEFAULT '—'::"text" NOT NULL,
    "nationality" "text" DEFAULT 'TN'::"text" NOT NULL,
    "potential" integer DEFAULT 0 NOT NULL,
    "score" integer DEFAULT 0 NOT NULL,
    "status" "public"."RecruitmentStatus" DEFAULT 'NON_TRAITE'::"public"."RecruitmentStatus" NOT NULL,
    "notes" "text",
    "scoutName" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "scoutExtra" "jsonb"
);


ALTER TABLE public."RecruitmentProspect" OWNER TO erp_admin;

--
-- Name: RecruteurAuditLog; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."RecruteurAuditLog" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "userName" "text" NOT NULL,
    "userRole" "text" NOT NULL,
    "action" "public"."RecruteurAuditAction" NOT NULL,
    "description" "text" NOT NULL,
    "player" "text",
    "ipAddress" "text",
    "severity" "public"."RecruteurAuditSeverity" DEFAULT 'INFO'::"public"."RecruteurAuditSeverity" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RecruteurAuditLog" OWNER TO erp_admin;

--
-- Name: RecruteurCalendarEvent; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."RecruteurCalendarEvent" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "title" "text" NOT NULL,
    "eventDate" timestamp(3) without time zone NOT NULL,
    "eventTime" "text",
    "type" "public"."RecruteurCalendarEventType" DEFAULT 'MATCH'::"public"."RecruteurCalendarEventType" NOT NULL,
    "location" "text",
    "note" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RecruteurCalendarEvent" OWNER TO erp_admin;

--
-- Name: RecruteurNotification; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."RecruteurNotification" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "player" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RecruteurNotification" OWNER TO erp_admin;

--
-- Name: ScoutReport; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."ScoutReport" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "prospectId" "text",
    "prospectName" "text" NOT NULL,
    "scoutName" "text" NOT NULL,
    "matchDate" "text",
    "matchObserved" "text",
    "opponent" "text",
    "technique" integer DEFAULT 0 NOT NULL,
    "physique" integer DEFAULT 0 NOT NULL,
    "mental" integer DEFAULT 0 NOT NULL,
    "tactique" integer DEFAULT 0 NOT NULL,
    "vitesse" integer DEFAULT 0 NOT NULL,
    "strengths" "text",
    "weaknesses" "text",
    "recommendation" "text",
    "decision" "text" DEFAULT 'observe'::"text" NOT NULL,
    "aiScore" integer,
    "status" "text" DEFAULT 'submitted'::"text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ScoutReport" OWNER TO erp_admin;

--
-- Name: ScoutWatchlist; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."ScoutWatchlist" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "prospectId" "text" NOT NULL,
    "priority" "text" DEFAULT 'B'::"text" NOT NULL,
    "notes" "jsonb",
    "scoutName" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ScoutWatchlist" OWNER TO erp_admin;

--
-- Name: SessionPresence; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."SessionPresence" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "playerId" "text" NOT NULL,
    "status" "text" DEFAULT 'Présent'::"text" NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SessionPresence" OWNER TO erp_admin;

--
-- Name: TrainingProgram; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."TrainingProgram" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "name" "text" NOT NULL,
    "objective" "text" DEFAULT ''::"text" NOT NULL,
    "duration" "text" DEFAULT '4 semaines'::"text" NOT NULL,
    "intensity" "text" DEFAULT 'Moyenne'::"text" NOT NULL,
    "playerIds" "text"[],
    "status" "text" DEFAULT 'brouillon'::"text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TrainingProgram" OWNER TO erp_admin;

--
-- Name: TrainingSession; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."TrainingSession" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "title" "text" NOT NULL,
    "type" "text" NOT NULL,
    "date" "text" NOT NULL,
    "time" "text" NOT NULL,
    "duration" "text" NOT NULL,
    "objective" "text" NOT NULL,
    "exercises" "text",
    "intensity" "text" DEFAULT 'Moyenne'::"text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TrainingSession" OWNER TO erp_admin;

--
-- Name: User; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."User" (
    "id" "text" NOT NULL,
    "email" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "acceptPrivacy" boolean DEFAULT false NOT NULL,
    "acceptTerms" boolean DEFAULT false NOT NULL,
    "fullName" "text" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "passwordHash" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "role" "public"."UserRole" DEFAULT 'ADMIN_CLUB'::"public"."UserRole" NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clubMemberRole" "public"."ClubMemberRole",
    "organizationId" "text"
);


ALTER TABLE public."User" OWNER TO erp_admin;

--
-- Name: ValidationRequest; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."ValidationRequest" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "type" "public"."ValidationRequestType" NOT NULL,
    "title" "text" NOT NULL,
    "detail" "text" NOT NULL,
    "amount" "text",
    "priority" "public"."ValidationPriority" DEFAULT 'NORMALE'::"public"."ValidationPriority" NOT NULL,
    "status" "public"."ValidationRequestStatus" DEFAULT 'EN_ATTENTE'::"public"."ValidationRequestStatus" NOT NULL,
    "requestedBy" "text" NOT NULL,
    "comment" "text",
    "sourceKind" "text",
    "sourceId" "text",
    "decidedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ValidationRequest" OWNER TO erp_admin;

--
-- Name: WellnessEntry; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."WellnessEntry" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "playerId" "text" NOT NULL,
    "sommeil" integer DEFAULT 0 NOT NULL,
    "fatigue" integer DEFAULT 0 NOT NULL,
    "stress" integer DEFAULT 0 NOT NULL,
    "douleur" integer DEFAULT 0 NOT NULL,
    "humeur" integer DEFAULT 0 NOT NULL,
    "filledAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."WellnessEntry" OWNER TO erp_admin;

--
-- Name: club_player_profiles; Type: TABLE; Schema: public; Owner: erp_admin
--

CREATE TABLE "public"."club_player_profiles" (
    "id" "text" NOT NULL,
    "clubPlayerId" "text" NOT NULL,
    "career" "jsonb",
    "evolution" "jsonb",
    "heatmapZones" "jsonb",
    "training" "jsonb",
    "matchAnalysis" "jsonb",
    "aiInsight" "jsonb",
    "fifaAttributes" "jsonb",
    "chemistry" "jsonb",
    "messages" "jsonb",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.club_player_profiles OWNER TO erp_admin;

--
-- Data for Name: AnalysteModuleData; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."AnalysteModuleData" ("id", "organizationId", "moduleKey", "payload", "createdAt", "updatedAt") FROM stdin;
a624a5d2-d262-44dc-a218-6cdddb2697bd	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	dashboard	{"info": {"club": "manchester united", "name": "hachani mohamed said", "season": "2026"}, "patterns": [{"id": "p1", "pattern": "Les performances chutent après 75 minutes.", "category": "performance", "confidence": 94}, {"id": "p2", "pattern": "Les blessures augmentent après 3 matchs consécutifs.", "category": "injury", "confidence": 87}, {"id": "p3", "pattern": "Le pressing diminue de 22% en deuxième mi-temps.", "category": "tactical", "confidence": 91}, {"id": "p4", "pattern": "xG +0.4 quand Ahmed démarre à gauche.", "category": "tactical", "confidence": 82}, {"id": "p5", "pattern": "Récupération -15% après séances haute intensité consécutives.", "category": "injury", "confidence": 79}], "liveStats": [{"color": "#8B5CF6", "label": "Possession", "value": "64%"}, {"color": "#22C55E", "label": "xG Projeté", "value": "2.3"}, {"color": "#F59E0B", "label": "Risque global", "value": "Moyen"}, {"color": "#3B82F6", "label": "Joueurs dispos", "value": "21/26"}], "tacticalCenter": {"risk": "Fatigue élevée milieu terrain", "formation": "4-3-3", "keyPlayer": "Ahmed Ben Salah", "weakPoint": "Couloir droit", "winProbability": 78, "recommendations": ["Renforcer couloir droit avec Ridha Ammar en soutien défensif.", "Réduire charge Karim Dridi — risque blessure genou +18%.", "Exploiter couloir gauche adversaire (42% des attaques EST)."]}}	2026-06-25 15:37:50.904	2026-06-25 15:37:50.904
5e533ce2-ea24-42e5-9471-9c6edbf888a4	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	executive	{"kpis": [{"label": "Valeur effectif", "value": "18.4M€", "change": "+12%", "positive": true}, {"label": "Évolution saison", "value": "+8.2 OVR", "change": "+3.1%", "positive": true}, {"label": "ROI joueurs", "value": "142%", "change": "+18%", "positive": true}, {"label": "Budget restant", "value": "1.2M€", "change": "-8%", "positive": false}, {"label": "Performance équipe", "value": "7.4/10", "change": "+0.6", "positive": true}], "recommendations": [{"type": "sell", "player": "Mohamed Sassi", "reason": "Pic de valeur — 2.1M€ estimé, demande scout confirmée"}, {"type": "renew", "player": "Ahmed Ben Salah", "reason": "Performance elite + potentiel marché 3.5M€ à 6 mois"}, {"type": "recruit", "player": "Hamza Lahmar (CSS)", "reason": "Similarité 82% Ali Mansouri — complément MC"}]}	2026-06-25 15:37:50.904	2026-06-25 15:37:50.904
6d835479-e4c3-43c8-84ed-5332acdaef60	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	live-match	{"score": {"away": 1, "home": 1}, "events": [{"desc": "But — tête sur corner", "team": "home", "type": "goal", "minute": 12, "player": "Ali Mansouri"}, {"desc": "Carton jaune — faute tactique", "team": "home", "type": "card", "minute": 28, "player": "Karim Dridi"}, {"desc": "Égalisation adverse", "team": "away", "type": "goal", "minute": 45, "player": "---"}, {"desc": "Remplacement — fatigue élevée (85%)", "team": "home", "type": "sub", "minute": 61, "player": "Ahmed Ben Salah"}], "minute": 65, "players": [{"name": "Ali Mansouri", "risk": 18, "fatigue": 55, "readiness": 92, "shouldSub": false}, {"name": "Karim Dridi", "risk": 62, "fatigue": 82, "readiness": 58, "shouldSub": true}, {"name": "Mohamed Sassi", "risk": 42, "fatigue": 68, "readiness": 72, "shouldSub": false}, {"name": "Sami Bouazizi", "risk": 22, "fatigue": 47, "readiness": 88, "shouldSub": false}, {"name": "Ridha Ammar", "risk": 20, "fatigue": 50, "readiness": 85, "shouldSub": false}], "awayTeam": "EST", "homeTeam": "manchester united", "minuteData": [{"xg": 0, "minute": 0, "fatigue": 10, "winProb": 43, "possession": 50}, {"xg": 0.1, "minute": 5, "fatigue": 14, "winProb": 46, "possession": 55}, {"xg": 0.3, "minute": 10, "fatigue": 18, "winProb": 50, "possession": 58}, {"xg": 0.6, "minute": 15, "fatigue": 22, "winProb": 54, "possession": 62}, {"xg": 0.8, "minute": 20, "fatigue": 27, "winProb": 52, "possession": 59}, {"xg": 1.1, "minute": 25, "fatigue": 33, "winProb": 56, "possession": 63}, {"xg": 1.4, "minute": 30, "fatigue": 39, "winProb": 58, "possession": 60}, {"xg": 1.6, "minute": 35, "fatigue": 45, "winProb": 55, "possession": 55}, {"xg": 1.8, "minute": 40, "fatigue": 51, "winProb": 52, "possession": 52}, {"xg": 2, "minute": 45, "fatigue": 56, "winProb": 54, "possession": 57}, {"xg": 2.2, "minute": 50, "fatigue": 60, "winProb": 57, "possession": 61}, {"xg": 2.4, "minute": 55, "fatigue": 65, "winProb": 55, "possession": 59}, {"xg": 2.6, "minute": 60, "fatigue": 70, "winProb": 53, "possession": 54}, {"xg": 2.7, "minute": 65, "fatigue": 76, "winProb": 50, "possession": 50}]}	2026-06-25 15:37:50.904	2026-06-25 15:37:50.904
ae631bdb-81cf-4430-9230-622e4cf1dbc0	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	prediction-teams	{"teams": ["FC Carthage", "EST", "CA", "CSS", "ESS", "ST", "CS Sfax", "OB"]}	2026-06-25 15:37:50.904	2026-06-25 15:37:50.904
f16901b1-601d-47ed-868d-91d5d7fad523	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ppi	{"players": [{"id": "1", "xg": 85, "age": 24, "ppi": 89, "form": "rising", "name": "Ahmed Ben Salah", "speed": 91, "trend": [82, 84, 85, 87, 88, 89], "vision": 78, "fatigue": 85, "stamina": 60, "position": "BU", "pressing": 87, "defending": 48, "dribbling": 82, "strengths": ["Vitesse", "xG élevé", "Pressing"], "leadership": 72, "weaknesses": ["Fatigue critique", "Défense"]}, {"id": "2", "xg": 72, "age": 26, "ppi": 84, "form": "stable", "name": "Ali Mansouri", "speed": 88, "trend": [80, 81, 82, 83, 83, 84], "vision": 80, "fatigue": 20, "stamina": 88, "position": "AG", "pressing": 76, "defending": 55, "dribbling": 85, "strengths": ["Dribbling", "Endurance", "Vision"], "leadership": 65, "weaknesses": ["xG", "Leadership"]}, {"id": "3", "xg": 70, "age": 23, "ppi": 71, "form": "falling", "name": "Youssef Trabelsi", "speed": 75, "trend": [78, 75, 72, 70, 71, 71], "vision": 85, "fatigue": 35, "stamina": 65, "position": "MOC", "pressing": 72, "defending": 60, "dribbling": 78, "strengths": ["Vision", "Technique"], "leadership": 68, "weaknesses": ["En rééducation", "Vitesse", "Stamina"]}, {"id": "4", "xg": 75, "age": 22, "ppi": 80, "form": "rising", "name": "Mohamed Sassi", "speed": 86, "trend": [75, 76, 78, 79, 80, 80], "vision": 74, "fatigue": 62, "stamina": 72, "position": "AD", "pressing": 80, "defending": 50, "dribbling": 79, "strengths": ["Vitesse", "Pressing"], "leadership": 60, "weaknesses": ["Leadership", "Défense"]}, {"id": "5", "xg": 65, "age": 27, "ppi": 82, "form": "falling", "name": "Karim Dridi", "speed": 78, "trend": [85, 84, 83, 82, 82, 82], "vision": 82, "fatigue": 78, "stamina": 70, "position": "MC", "pressing": 85, "defending": 80, "dribbling": 72, "strengths": ["Leadership", "Vision", "Défense"], "leadership": 85, "weaknesses": ["Fatigue élevée", "xG"]}, {"id": "6", "xg": 62, "age": 25, "ppi": 78, "form": "rising", "name": "Sami Bouazizi", "speed": 76, "trend": [74, 75, 76, 77, 78, 78], "vision": 76, "fatigue": 45, "stamina": 80, "position": "MC", "pressing": 78, "defending": 76, "dribbling": 70, "strengths": ["Endurance", "Pressing", "Défense"], "leadership": 72, "weaknesses": ["xG"]}, {"id": "7", "xg": 45, "age": 28, "ppi": 76, "form": "stable", "name": "Ridha Ammar", "speed": 74, "trend": [73, 74, 75, 75, 76, 76], "vision": 68, "fatigue": 38, "stamina": 82, "position": "DD", "pressing": 72, "defending": 88, "dribbling": 62, "strengths": ["Défense", "Leadership", "Endurance"], "leadership": 80, "weaknesses": ["xG", "Dribbling"]}, {"id": "8", "xg": 35, "age": 30, "ppi": 85, "form": "stable", "name": "Haddad", "speed": 68, "trend": [83, 84, 84, 85, 85, 85], "vision": 82, "fatigue": 25, "stamina": 80, "position": "GB", "pressing": 65, "defending": 90, "dribbling": 55, "strengths": ["Défense", "Leadership", "Vision"], "leadership": 88, "weaknesses": ["xG", "Vitesse"]}]}	2026-06-25 15:37:50.904	2026-06-25 15:37:50.904
225c174d-86a4-4613-8346-6fee0882f1d6	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	chemistry	{"matrix": [{"a": "Ahmed", "b": "Ali", "score": 92, "history": 94, "passing": 95, "movement": 91, "pressing": 88}, {"a": "Ahmed", "b": "Karim", "score": 45, "history": 44, "passing": 42, "movement": 48, "pressing": 46}, {"a": "Ahmed", "b": "Mohamed", "score": 85, "history": 87, "passing": 87, "movement": 84, "pressing": 82}, {"a": "Ali", "b": "Youssef", "score": 78, "history": 79, "passing": 80, "movement": 76, "pressing": 77}, {"a": "Ali", "b": "Sami", "score": 82, "history": 81, "passing": 83, "movement": 80, "pressing": 84}, {"a": "Karim", "b": "Ridha", "score": 88, "history": 87, "passing": 86, "movement": 89, "pressing": 90}, {"a": "Karim", "b": "Sami", "score": 75, "history": 76, "passing": 74, "movement": 77, "pressing": 73}, {"a": "Youssef", "b": "Mohamed", "score": 68, "history": 69, "passing": 70, "movement": 65, "pressing": 68}, {"a": "Ridha", "b": "Haddad", "score": 91, "history": 93, "passing": 88, "movement": 90, "pressing": 93}, {"a": "Mohamed", "b": "Ali", "score": 79, "history": 79, "passing": 80, "movement": 78, "pressing": 79}, {"a": "Sami", "b": "Ridha", "score": 84, "history": 83, "passing": 82, "movement": 85, "pressing": 86}, {"a": "Ahmed", "b": "Haddad", "score": 62, "history": 61, "passing": 60, "movement": 64, "pressing": 63}], "players": ["Ahmed", "Ali", "Youssef", "Mohamed", "Karim", "Sami", "Ridha", "Haddad"], "nodePositions": {"Ali": {"x": 80, "y": 30}, "Sami": {"x": 15, "y": 30}, "Ahmed": {"x": 50, "y": 15}, "Karim": {"x": 20, "y": 60}, "Ridha": {"x": 10, "y": 50}, "Haddad": {"x": 50, "y": 50}, "Mohamed": {"x": 50, "y": 80}, "Youssef": {"x": 75, "y": 60}}}	2026-06-25 15:37:50.904	2026-06-25 15:37:50.904
d34b5651-9377-4711-b8de-a8946230fe51	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	patterns	{"summary": "Le modèle deep learning a analysé 847 matchs, 12 400 séances et 3 saisons de données wearables. Voici les patterns détectés automatiquement avec confiance > 75%.", "patterns": [{"id": "p1", "pattern": "Les performances chutent après 75 minutes.", "category": "performance", "confidence": 94}, {"id": "p2", "pattern": "Les blessures augmentent après 3 matchs consécutifs.", "category": "injury", "confidence": 87}, {"id": "p3", "pattern": "Le pressing diminue de 22% en deuxième mi-temps.", "category": "tactical", "confidence": 91}, {"id": "p4", "pattern": "xG +0.4 quand Ahmed démarre à gauche.", "category": "tactical", "confidence": 82}, {"id": "p5", "pattern": "Récupération -15% après séances haute intensité consécutives.", "category": "injury", "confidence": 79}]}	2026-06-25 15:37:50.904	2026-06-25 15:37:50.904
504f828f-500d-4ec1-81ba-72dfd69c1bfd	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	tactical	{"bench": [{"x": 0, "y": 0, "id": "b1", "xg": 0.1, "ovr": 77, "name": "Oussama Haddadi", "short": "HAD2", "speed": 86, "fatigue": 15, "position": "DG", "injuryRisk": 10}, {"x": 0, "y": 0, "id": "b2", "xg": 0.7, "ovr": 83, "name": "Firas Chaouat", "short": "CHA", "speed": 84, "fatigue": 22, "position": "BU", "injuryRisk": 18}, {"x": 0, "y": 0, "id": "b3", "xg": 0.3, "ovr": 80, "name": "Anis Slimane", "short": "SLI", "speed": 83, "fatigue": 18, "position": "MC", "injuryRisk": 14}, {"x": 0, "y": 0, "id": "b4", "xg": 0, "ovr": 78, "name": "Bilel Ifa", "short": "IFA", "speed": 72, "fatigue": 28, "position": "DC", "injuryRisk": 30}, {"x": 0, "y": 0, "id": "b5", "xg": 0, "ovr": 79, "name": "Aymen Dahmen", "short": "DAH", "speed": 66, "fatigue": 12, "position": "GB", "injuryRisk": 8}], "squad": [{"x": 50, "y": 92, "id": "gb", "xg": 0, "ovr": 82, "name": "Haddad", "short": "HAD", "speed": 68, "fatigue": 25, "position": "GB", "injuryRisk": 12}, {"x": 18, "y": 72, "id": "dd", "xg": 0.1, "ovr": 79, "name": "Ridha Ammar", "short": "AMM", "speed": 84, "fatigue": 38, "position": "DD", "injuryRisk": 18}, {"x": 38, "y": 75, "id": "dc1", "xg": 0.1, "ovr": 81, "name": "Sami Bouazizi", "short": "BOU", "speed": 76, "fatigue": 45, "position": "DC", "injuryRisk": 22}, {"x": 62, "y": 75, "id": "dc2", "xg": 0.1, "ovr": 83, "name": "Karim Dridi", "short": "DRI", "speed": 74, "fatigue": 78, "position": "DC", "injuryRisk": 58}, {"x": 82, "y": 72, "id": "dg", "xg": 0.2, "ovr": 80, "name": "Mohamed Sassi", "short": "SAS", "speed": 88, "fatigue": 62, "position": "DG", "injuryRisk": 38}, {"x": 30, "y": 52, "id": "mc1", "xg": 0.3, "ovr": 84, "name": "Ali Mansouri", "short": "MAN", "speed": 85, "fatigue": 20, "position": "MC", "injuryRisk": 12}, {"x": 50, "y": 48, "id": "mc2", "xg": 0.4, "ovr": 78, "name": "Youssef Trabelsi", "short": "TRA", "speed": 80, "fatigue": 35, "position": "MOC", "injuryRisk": 45}, {"x": 70, "y": 52, "id": "mc3", "xg": 0.3, "ovr": 79, "name": "Wael Lahmar", "short": "LAH", "speed": 82, "fatigue": 48, "position": "MC", "injuryRisk": 25}, {"x": 22, "y": 28, "id": "ag", "xg": 0.5, "ovr": 81, "name": "Hamza Mathlouthi", "short": "MAT", "speed": 89, "fatigue": 30, "position": "AG", "injuryRisk": 20}, {"x": 50, "y": 22, "id": "bu", "xg": 0.9, "ovr": 88, "name": "Ahmed Ben Salah", "short": "AHM", "speed": 88, "fatigue": 85, "position": "BU", "injuryRisk": 82}, {"x": 78, "y": 28, "id": "ad", "xg": 0.6, "ovr": 80, "name": "Mohamed Sassi", "short": "SAS2", "speed": 90, "fatigue": 62, "position": "AD", "injuryRisk": 38}], "aiCenter": {"risk": "Fatigue élevée milieu terrain", "formation": "4-3-3", "keyPlayer": "Ahmed Ben Salah", "weakPoint": "Couloir droit", "winProbability": 78, "recommendations": ["Renforcer couloir droit avec Ridha Ammar en soutien défensif.", "Réduire charge Karim Dridi — risque blessure genou +18%.", "Exploiter couloir gauche adversaire (42% des attaques EST)."]}, "suggestions": [{"id": "s1", "type": "positive", "action": "Déplacer Ahmed à gauche", "impact": "+12% xG", "confidence": 92}, {"id": "s2", "type": "warning", "action": "Retirer Karim Dridi", "impact": "-20% risque blessure", "confidence": 87}, {"id": "s3", "type": "positive", "action": "Pressing haut sur MC adverse", "impact": "+8% possession", "confidence": 78}]}	2026-06-25 15:37:50.904	2026-06-25 15:37:50.904
27eac024-24e3-4bdb-8c7e-64f0851ccfc9	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	video-analysis	{"events": [{"id": "e1", "type": "tir", "label": "Tir", "minute": 12, "timestamp": 720, "description": "Ahmed — frappe lointaine, corner"}, {"id": "e2", "type": "but", "label": "But", "minute": 25, "timestamp": 1500, "description": "Ahmed Ben Salah — 1-0"}, {"id": "e3", "type": "faute", "label": "Faute", "minute": 42, "timestamp": 2520, "description": "Karim Dridi — carton jaune"}, {"id": "e4", "type": "occasion", "label": "Occasion", "minute": 55, "timestamp": 3300, "description": "Ali Mansouri — passe décisive manquée"}, {"id": "e5", "type": "contre", "label": "Contre-attaque", "minute": 80, "timestamp": 4800, "description": "Transition rapide — tir bloqué"}], "insights": [{"trend": "up", "player": "Ali Mansouri", "rating": 8.8, "analysis": "Meilleure performance. 12 dribbles réussis, 92% passes. Pressing efficace premier tiers."}, {"trend": "down", "player": "Ahmed Ben Salah", "rating": 7.2, "analysis": "Diminution visible après 60min — fatigue. 3 pertes de balle zone offensive. Remplacement justifié."}, {"trend": "stable", "player": "Karim Dridi", "rating": 7.5, "analysis": "Bonne couverture axiale. Leadership défensif. Carton jaune évitable — gestion."}, {"trend": "up", "player": "Ridha Ammar", "rating": 8.1, "analysis": "Excellent duel aérien (78%). Sortie propre gardien à 34'. Aucune erreur détectée."}], "highlights": [{"id": "h1", "conf": 98, "desc": "Tête sur corner — angle parfait 6m", "tags": ["Coup de tête", "Corner", "Surface"], "time": "12'42", "type": "But", "player": "Ali Mansouri"}, {"id": "h2", "conf": 94, "desc": "Faute tactique — blocage pressing", "tags": ["Pressing haut", "Récupération"], "time": "28'18", "type": "Faute", "player": "Karim Dridi"}, {"id": "h3", "conf": 91, "desc": "Frappe 20m — poteau gauche — xG 0.41", "tags": ["Frappe lointaine", "xG élevé"], "time": "44'55", "type": "Occasion", "player": "Ahmed"}, {"id": "h4", "conf": 99, "desc": "Substitution — fatigue 85% détectée", "tags": ["Fatigue", "Tactical"], "time": "61'02", "type": "Remplacement", "player": "Ahmed → Sami"}, {"id": "h5", "conf": 87, "desc": "Couloir gauche ouvert — contre-attaque", "tags": ["Défense", "Contre"], "time": "78'33", "type": "Danger", "player": "Défense"}], "matchTitle": "manchester united vs EST — Match Footage"}	2026-06-25 15:37:50.904	2026-06-25 15:37:50.904
fef13a7b-ff33-451f-bc27-d84b74abbb0e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	video-coach	{"insights": [{"title": "But Ahmed 25'", "detail": "Appel profonde parfait, finition du pied gauche.", "category": "top", "timestamp": "25:12"}, {"title": "Pressing collectif 1ère MT", "detail": "Récupérations hautes x3 en zone adverse.", "category": "strong", "timestamp": "18:00"}, {"title": "Perte balle Karim 42'", "detail": "Passe risquée sous pression — carton jaune.", "category": "error", "timestamp": "42:30"}, {"title": "Couloir droit exposé", "detail": "3 occasions concédées sur transitions rapides.", "category": "weak", "timestamp": "55:00"}]}	2026-06-25 15:37:50.904	2026-06-25 15:37:50.904
6d0ecc75-5a68-47b7-ae22-b579ed900e3d	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	replay	{"events": [{"id": "e1", "type": "tir", "label": "Tir", "minute": 12, "timestamp": 720, "description": "Ahmed — frappe lointaine, corner"}, {"id": "e2", "type": "but", "label": "But", "minute": 25, "timestamp": 1500, "description": "Ahmed Ben Salah — 1-0"}, {"id": "e3", "type": "faute", "label": "Faute", "minute": 42, "timestamp": 2520, "description": "Karim Dridi — carton jaune"}, {"id": "e4", "type": "occasion", "label": "Occasion", "minute": 55, "timestamp": 3300, "description": "Ali Mansouri — passe décisive manquée"}, {"id": "e5", "type": "contre", "label": "Contre-attaque", "minute": 80, "timestamp": 4800, "description": "Transition rapide — tir bloqué"}], "videoDuration": 5400}	2026-06-25 15:37:50.904	2026-06-25 15:37:50.904
d72c869a-6095-4508-a8af-1134dde177cb	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	opponent	{"intel": {"name": "EST", "advice": ["Renforcer latéral gauche", "Couvrir transitions rapides centre", "Pressing sur meneur de jeu #10"], "leftPct": 42, "rightPct": 25, "centerPct": 33, "keyPlayers": [{"name": "Jebali", "role": "MOC", "threat": 88}, {"name": "Badri", "role": "BU", "threat": 82}, {"name": "Chaalali", "role": "MC", "threat": 76}], "weaknesses": ["Défense centrale lente", "Couloir droit exposé", "Faiblesse sur coups de pied arrêtés"], "dangerZones": [{"zone": "Couloir gauche", "intensity": 92}, {"zone": "Zone 14", "intensity": 78}, {"zone": "Surface", "intensity": 65}, {"zone": "Couloir droit", "intensity": 45}]}}	2026-06-25 15:37:50.904	2026-06-25 15:37:50.904
2519bf6b-372a-4739-b7c5-8eeb3a5854b0	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	fatigue	{"intervals": ["0-15", "15-30", "30-45", "45-60", "60-75", "75-90"], "teamFatigue": [{"goals": 1, "errors": 0, "actions": 142, "fatigue": 18, "interval": "0-15", "intensity": 92}, {"goals": 0, "errors": 1, "actions": 138, "fatigue": 32, "interval": "15-30", "intensity": 88}, {"goals": 0, "errors": 1, "actions": 128, "fatigue": 50, "interval": "30-45", "intensity": 82}, {"goals": 1, "errors": 0, "actions": 135, "fatigue": 58, "interval": "45-60", "intensity": 85}, {"goals": 0, "errors": 2, "actions": 112, "fatigue": 74, "interval": "60-75", "intensity": 72}, {"goals": 0, "errors": 3, "actions": 94, "fatigue": 89, "interval": "75-90", "intensity": 61}], "playerHeatmaps": [{"data": [{"fatigue": 15, "sprints": 8, "interval": "0-15"}, {"fatigue": 30, "sprints": 9, "interval": "15-30"}, {"fatigue": 50, "sprints": 7, "interval": "30-45"}, {"fatigue": 65, "sprints": 6, "interval": "45-60"}, {"fatigue": 82, "sprints": 4, "interval": "60-75"}, {"fatigue": 95, "sprints": 2, "interval": "75-90"}], "name": "Ahmed Ben Salah"}, {"data": [{"fatigue": 20, "sprints": 6, "interval": "0-15"}, {"fatigue": 35, "sprints": 7, "interval": "15-30"}, {"fatigue": 52, "sprints": 6, "interval": "30-45"}, {"fatigue": 65, "sprints": 5, "interval": "45-60"}, {"fatigue": 78, "sprints": 3, "interval": "60-75"}, {"fatigue": 88, "sprints": 2, "interval": "75-90"}], "name": "Karim Dridi"}, {"data": [{"fatigue": 10, "sprints": 9, "interval": "0-15"}, {"fatigue": 20, "sprints": 10, "interval": "15-30"}, {"fatigue": 32, "sprints": 9, "interval": "30-45"}, {"fatigue": 42, "sprints": 8, "interval": "45-60"}, {"fatigue": 54, "sprints": 7, "interval": "60-75"}, {"fatigue": 62, "sprints": 6, "interval": "75-90"}], "name": "Ali Mansouri"}]}	2026-06-25 15:37:50.904	2026-06-25 15:37:50.904
ebdc26e5-8bee-4fcc-9b7f-c4022cb5ae81	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	whoop	{"squad": [{"id": "1", "age": 26, "hrv": 68, "club": "FC Carthage", "name": "Ahmed Ben Salah", "spo2": 98, "photo": "https://images.unsplash.com/photo-1574629810360-43c2d185f1d8?w=120&h=120&fit=crop&crop=faces", "steps": 8400, "zones": [{"zone": "Zone 0", "color": "#64748B", "minutes": 420}, {"zone": "Zone 1", "color": "#3B82F6", "minutes": 38}, {"zone": "Zone 2", "color": "#22C55E", "minutes": 22}, {"zone": "Zone 3", "color": "#F59E0B", "minutes": 14}, {"zone": "Zone 4", "color": "#FF7A00", "minutes": 8}, {"zone": "Zone 5", "color": "#EF4444", "minutes": 3}], "alerts": [{"id": "a1", "time": "14:28", "type": "ok", "message": "Sync complétée"}, {"id": "a2", "time": "08:15", "type": "ok", "message": "Recovery au-dessus baseline"}], "height": "1.82 m", "number": 9, "strain": 14.2, "stress": 28, "weight": "78 kg", "battery": 78, "syncLog": [{"time": "14:28:41", "type": "Recovery calculé", "status": "ok"}, {"time": "14:28:39", "type": "Sommeil importé", "status": "ok"}, {"time": "14:28:38", "type": "HRV synchronisé", "status": "ok"}], "weather": "22°C · Humidité 64%", "calories": 2650, "deviceId": "W4-9A2F-8841", "firmware": "5.2.1", "hourlyHr": [{"bpm": 46, "hour": "00h"}, {"bpm": 44, "hour": "04h"}, {"bpm": 62, "hour": "08h"}, {"bpm": 78, "hour": "12h"}, {"bpm": 142, "hour": "16h"}, {"bpm": 88, "hour": "20h"}], "lastSync": "Il y a 3 min", "position": "ATT", "recovery": 82, "skinTemp": 36.4, "timeline": [{"time": "08:00", "label": "Réveil · sommeil analysé"}, {"time": "09:20", "label": "Entraînement collectif"}, {"time": "11:00", "label": "Recovery window"}, {"time": "15:30", "label": "Session tactique"}, {"time": "18:00", "label": "Recommandation sommeil 22h30"}], "aiInsight": "Récupération excellente — charge match demain recommandée. HRV +12% vs baseline personnelle (61 ms).", "athleteId": "ATH-88412", "connected": true, "fitToPlay": true, "readiness": "Optimal", "restingHr": 48, "sleepNeed": 8, "bloodGroup": "O+", "coachNotes": "Profil stable — suivi standard.", "injuryRisk": "Low", "lastSyncAt": "14:28:41", "sleepHours": 7.4, "todayGoals": ["Hydratation 3L", "Étirements 15 min", "Couche 22h30"], "hrvBaseline": 61, "memberSince": "Août 2024", "sleepStages": {"rem": 1.7, "sws": 2.1, "awake": 0.4, "light": 3.2}, "aiConfidence": 94, "dominantFoot": "Droit", "fitnessScore": 88, "strainTarget": 15.5, "weeklyStrain": [{"day": "Lun", "strain": 12.1, "recovery": 74}, {"day": "Mar", "strain": 15.8, "recovery": 62}, {"day": "Mer", "strain": 8.2, "recovery": 85}, {"day": "Jeu", "strain": 16.4, "recovery": 58}, {"day": "Ven", "strain": 6.1, "recovery": 91}, {"day": "Sam", "strain": 18.2, "recovery": 55}, {"day": "Dim", "strain": 14.2, "recovery": 82}], "injuryHistory": "Aucune blessure active", "recoveryDelta": 5, "upcomingMatch": "Espérance ST · Sam 20h00", "respiratoryRate": 14.2, "sleepPerformance": 88, "aiRecommendations": ["Titulaire recommandé", "Charge match normale", "Hydratation 3L"]}, {"id": "2", "age": 26, "hrv": 52, "club": "FC Carthage", "name": "Karim Dridi", "spo2": 98, "photo": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces", "steps": 8400, "zones": [{"zone": "Zone 0", "color": "#64748B", "minutes": 380}, {"zone": "Zone 1", "color": "#3B82F6", "minutes": 45}, {"zone": "Zone 2", "color": "#22C55E", "minutes": 28}, {"zone": "Zone 3", "color": "#F59E0B", "minutes": 18}, {"zone": "Zone 4", "color": "#FF7A00", "minutes": 12}, {"zone": "Zone 5", "color": "#EF4444", "minutes": 6}], "alerts": [{"id": "k1", "time": "14:23", "type": "warn", "message": "Strain élevé (16.8)"}, {"id": "k2", "time": "08:00", "type": "warn", "message": "Sommeil insuffisant"}], "height": "1.82 m", "number": 8, "strain": 16.8, "stress": 58, "weight": "78 kg", "battery": 64, "syncLog": [{"time": "14:23:12", "type": "Recovery calculé", "status": "ok"}, {"time": "14:23:10", "type": "Strain jour mis à jour (16.8)", "status": "warn"}, {"time": "14:23:09", "type": "Sommeil importé (6h06)", "status": "ok"}], "weather": "22°C · Humidité 64%", "calories": 2650, "deviceId": "W4-7C1B-2290", "firmware": "5.2.1", "hourlyHr": [{"bpm": 52, "hour": "00h"}, {"bpm": 50, "hour": "04h"}, {"bpm": 68, "hour": "08h"}, {"bpm": 82, "hour": "12h"}, {"bpm": 156, "hour": "16h"}, {"bpm": 94, "hour": "20h"}], "lastSync": "Il y a 8 min", "position": "MIL", "recovery": 58, "skinTemp": 36.7, "timeline": [{"time": "08:00", "label": "Réveil · sommeil analysé"}, {"time": "09:20", "label": "Entraînement collectif"}, {"time": "11:00", "label": "Recovery window"}, {"time": "15:30", "label": "Session tactique"}, {"time": "18:00", "label": "Recommandation sommeil 22h30"}], "aiInsight": "Strain au-dessus de l'objectif (14.0) — réduire intensité séance. Risque fatigue J+2 si charge maintenue.", "athleteId": "ATH-22908", "connected": true, "fitToPlay": false, "readiness": "Modéré", "restingHr": 54, "sleepNeed": 8.2, "bloodGroup": "O+", "coachNotes": "Limiter sprints haute intensité aujourd'hui.", "injuryRisk": "Medium", "lastSyncAt": "14:23:12", "sleepHours": 6.1, "todayGoals": ["Hydratation 3L", "Étirements 15 min", "Couche 22h30"], "hrvBaseline": 58, "memberSince": "Jan 2025", "sleepStages": {"rem": 0.9, "sws": 1.6, "awake": 0.8, "light": 2.8}, "aiConfidence": 93, "dominantFoot": "Droit", "fitnessScore": 62, "strainTarget": 14, "weeklyStrain": [{"day": "Lun", "strain": 14.2, "recovery": 68}, {"day": "Mar", "strain": 17.1, "recovery": 52}, {"day": "Mer", "strain": 11.4, "recovery": 71}, {"day": "Jeu", "strain": 18.9, "recovery": 48}, {"day": "Ven", "strain": 9.2, "recovery": 76}, {"day": "Sam", "strain": 19.4, "recovery": 44}, {"day": "Dim", "strain": 16.8, "recovery": 58}], "injuryHistory": "Aucune blessure active", "recoveryDelta": -2, "upcomingMatch": "Espérance ST · Sam 20h00", "respiratoryRate": 15.1, "sleepPerformance": 71, "aiRecommendations": ["Réduire intensité", "Boire 1.5L", "Sieste 30 min"]}, {"id": "3", "age": 26, "hrv": 74, "club": "FC Carthage", "name": "Ali Mansouri", "spo2": 98, "photo": "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=120&h=120&fit=crop&crop=faces", "steps": 8400, "zones": [{"zone": "Zone 0", "color": "#64748B", "minutes": 450}, {"zone": "Zone 1", "color": "#3B82F6", "minutes": 28}, {"zone": "Zone 2", "color": "#22C55E", "minutes": 15}, {"zone": "Zone 3", "color": "#F59E0B", "minutes": 8}, {"zone": "Zone 4", "color": "#FF7A00", "minutes": 4}, {"zone": "Zone 5", "color": "#EF4444", "minutes": 1}], "alerts": [{"id": "a1", "time": "14:28", "type": "ok", "message": "Sync complétée"}, {"id": "a2", "time": "08:15", "type": "ok", "message": "Recovery au-dessus baseline"}], "height": "1.82 m", "number": 4, "strain": 9.4, "stress": 28, "weight": "78 kg", "battery": 91, "syncLog": [{"time": "14:28:41", "type": "Recovery calculé", "status": "ok"}, {"time": "14:28:39", "type": "Sommeil importé", "status": "ok"}, {"time": "14:28:38", "type": "HRV synchronisé", "status": "ok"}], "weather": "22°C · Humidité 64%", "calories": 2650, "deviceId": "W4-3D8E-7712", "firmware": "5.2.0", "hourlyHr": [{"bpm": 44, "hour": "00h"}, {"bpm": 42, "hour": "04h"}, {"bpm": 58, "hour": "08h"}, {"bpm": 72, "hour": "12h"}, {"bpm": 128, "hour": "16h"}, {"bpm": 76, "hour": "20h"}], "lastSync": "Il y a 1 min", "position": "DEF", "recovery": 91, "skinTemp": 36.2, "timeline": [{"time": "08:00", "label": "Réveil · sommeil analysé"}, {"time": "09:20", "label": "Entraînement collectif"}, {"time": "11:00", "label": "Recovery window"}, {"time": "15:30", "label": "Session tactique"}, {"time": "18:00", "label": "Recommandation sommeil 22h30"}], "aiInsight": "Profil recovery elite — disponible titulaire sans restriction. Sommeil au-dessus du besoin (+24 min).", "athleteId": "ATH-77124", "connected": true, "fitToPlay": true, "readiness": "Optimal", "restingHr": 46, "sleepNeed": 7.8, "bloodGroup": "O+", "coachNotes": "Profil stable — suivi standard.", "injuryRisk": "Low", "lastSyncAt": "14:30:05", "sleepHours": 8.2, "todayGoals": ["Hydratation 3L", "Étirements 15 min", "Couche 22h30"], "hrvBaseline": 66, "memberSince": "Mars 2024", "sleepStages": {"rem": 2, "sws": 2.4, "awake": 0.3, "light": 3.5}, "aiConfidence": 96, "dominantFoot": "Droit", "fitnessScore": 94, "strainTarget": 12, "weeklyStrain": [{"day": "Lun", "strain": 8.1, "recovery": 88}, {"day": "Mar", "strain": 10.2, "recovery": 82}, {"day": "Mer", "strain": 5.4, "recovery": 95}, {"day": "Jeu", "strain": 11.8, "recovery": 78}, {"day": "Ven", "strain": 4.2, "recovery": 96}, {"day": "Sam", "strain": 12.4, "recovery": 80}, {"day": "Dim", "strain": 9.4, "recovery": 91}], "injuryHistory": "Aucune blessure active", "recoveryDelta": 8, "upcomingMatch": "Espérance ST · Sam 20h00", "respiratoryRate": 13.8, "sleepPerformance": 94, "aiRecommendations": ["Maintenir charge actuelle", "Monitoring HRV"]}, {"id": "4", "age": 26, "hrv": 41, "club": "FC Carthage", "name": "Youssef Khelifi", "spo2": 96, "photo": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=faces", "steps": 8400, "zones": [{"zone": "Zone 0", "color": "#64748B", "minutes": 410}, {"zone": "Zone 1", "color": "#3B82F6", "minutes": 32}, {"zone": "Zone 2", "color": "#22C55E", "minutes": 18}, {"zone": "Zone 3", "color": "#F59E0B", "minutes": 10}, {"zone": "Zone 4", "color": "#FF7A00", "minutes": 5}, {"zone": "Zone 5", "color": "#EF4444", "minutes": 2}], "alerts": [{"id": "y1", "time": "18:02", "type": "error", "message": "Recovery < 50%"}, {"id": "y2", "time": "22:14", "type": "warn", "message": "Batterie 12%"}, {"id": "y3", "time": "22:14", "type": "error", "message": "Joueur déconnecté"}], "height": "1.82 m", "number": 1, "strain": 11.2, "stress": 72, "weight": "78 kg", "battery": 12, "syncLog": [{"time": "22:14:33", "type": "Dernière sync — appareil hors ligne", "status": "error"}, {"time": "22:14:30", "type": "Batterie faible (12%)", "status": "warn"}, {"time": "18:02:11", "type": "Recovery calculé (42%)", "status": "warn"}], "weather": "22°C · Humidité 64%", "calories": 2650, "deviceId": "W4-1F4A-0038", "firmware": "5.1.9", "hourlyHr": [{"bpm": 56, "hour": "00h"}, {"bpm": 54, "hour": "04h"}, {"bpm": 72, "hour": "08h"}, {"bpm": 88, "hour": "12h"}, {"bpm": 118, "hour": "16h"}, {"bpm": 82, "hour": "20h"}], "lastSync": "Hier 22:14", "position": "GAR", "recovery": 42, "skinTemp": 36.9, "timeline": [{"time": "08:00", "label": "Réveil · sommeil analysé"}, {"time": "09:20", "label": "Entraînement collectif"}, {"time": "11:00", "label": "Recovery window"}, {"time": "15:30", "label": "Session tactique"}, {"time": "18:00", "label": "Recommandation sommeil 22h30"}], "aiInsight": "Appareil déconnecté depuis 16h — resynchroniser avant entraînement. Recovery critique, sommeil -2h42 vs besoin.", "athleteId": "ATH-00381", "connected": false, "fitToPlay": false, "readiness": "Fatigué", "restingHr": 58, "sleepNeed": 8.5, "bloodGroup": "O+", "coachNotes": "Ne pas convoquer sans avis médical.", "injuryRisk": "High", "lastSyncAt": "22:14:33", "sleepHours": 5.8, "todayGoals": ["Hydratation 3L", "Étirements 15 min", "Couche 22h30"], "hrvBaseline": 55, "memberSince": "Juin 2024", "sleepStages": {"rem": 0.9, "sws": 1.4, "awake": 1.1, "light": 2.4}, "aiConfidence": 89, "dominantFoot": "Droit", "fitnessScore": 48, "strainTarget": 13, "weeklyStrain": [{"day": "Lun", "strain": 10.1, "recovery": 55}, {"day": "Mar", "strain": 13.4, "recovery": 48}, {"day": "Mer", "strain": 7.8, "recovery": 62}, {"day": "Jeu", "strain": 14.2, "recovery": 44}, {"day": "Ven", "strain": 8.1, "recovery": 68}, {"day": "Sam", "strain": 15.1, "recovery": 38}, {"day": "Dim", "strain": 11.2, "recovery": 42}], "injuryHistory": "Aucune blessure active", "recoveryDelta": -6, "upcomingMatch": "Espérance ST · Sam 20h00", "respiratoryRate": 15.8, "sleepPerformance": 58, "aiRecommendations": ["Repos actif", "Resync WHOOP", "Évaluation médicale"]}], "defaultPlayerId": "2"}	2026-06-25 15:37:50.904	2026-06-25 15:37:50.904
d8cebfc7-35ed-4183-99e1-c814179e382c	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	injuries	{"predictions": [{"id": "1", "name": "Ahmed Ben Salah", "prob7": 83, "prob14": 71, "prob30": 52, "factors": [{"color": "#EF4444", "label": "Fatigue", "value": 85}, {"color": "#F59E0B", "label": "Sommeil", "value": 62}, {"color": "#EF4444", "label": "Charge", "value": 92}, {"color": "#F59E0B", "label": "Historique blessure", "value": 78}]}, {"id": "5", "name": "Karim Dridi", "prob7": 58, "prob14": 48, "prob30": 35, "factors": [{"color": "#F59E0B", "label": "Fatigue", "value": 78}, {"color": "#F59E0B", "label": "Sommeil", "value": 71}, {"color": "#EF4444", "label": "Charge", "value": 88}, {"color": "#22C55E", "label": "Historique blessure", "value": 55}]}, {"id": "2", "name": "Ali Mansouri", "prob7": 12, "prob14": 18, "prob30": 22, "factors": [{"color": "#22C55E", "label": "Fatigue", "value": 20}, {"color": "#22C55E", "label": "Sommeil", "value": 88}, {"color": "#22C55E", "label": "Charge", "value": 68}, {"color": "#22C55E", "label": "Historique blessure", "value": 15}]}]}	2026-06-25 15:37:50.904	2026-06-25 15:37:50.904
5c14e8b1-1b40-4913-826f-8c349facb5ec	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	injury-forecast	{"forecasts": [{"id": "f1", "load": 92, "name": "Ahmed Ben Salah", "injury": "Ischio-jambier droit Grade II", "fatigue": 85, "position": "BU", "startDate": "10/06/2026", "confidence": 87, "returnDays": 14, "recoverySteps": [{"day": 1, "done": true, "label": "RICE Protocol — repos + glace"}, {"day": 3, "done": true, "label": "Électrostimulation + bain froid"}, {"day": 7, "done": true, "label": "Course légère 30min"}, {"day": 10, "done": false, "label": "Exercices sans ballon"}, {"day": 14, "done": false, "label": "Retour entraînement complet"}], "riskAfterReturn": 38, "recoveryTimeline": [{"day": "J0", "fitness": 30}, {"day": "J3", "fitness": 40}, {"day": "J5", "fitness": 52}, {"day": "J7", "fitness": 63}, {"day": "J10", "fitness": 74}, {"day": "J12", "fitness": 82}, {"day": "J14", "fitness": 91}]}, {"id": "f2", "load": 55, "name": "Youssef Trabelsi", "injury": "Entorse cheville Grade I", "fatigue": 35, "position": "MOC", "startDate": "01/06/2026", "confidence": 92, "returnDays": 7, "recoverySteps": [{"day": 1, "done": true, "label": "Immobilisation + anti-inflammatoires"}, {"day": 3, "done": true, "label": "Kiné quotidienne"}, {"day": 5, "done": true, "label": "Proprioception"}, {"day": 7, "done": false, "label": "Retour entraînement partiel"}], "riskAfterReturn": 25, "recoveryTimeline": [{"day": "J0", "fitness": 45}, {"day": "J2", "fitness": 55}, {"day": "J4", "fitness": 65}, {"day": "J5", "fitness": 73}, {"day": "J6", "fitness": 80}, {"day": "J7", "fitness": 88}]}, {"id": "f3", "load": 88, "name": "Karim Dridi", "injury": "Douleur genou (inflammation légère)", "fatigue": 78, "position": "MC", "startDate": "15/06/2026", "confidence": 78, "returnDays": 5, "recoverySteps": [{"day": 1, "done": true, "label": "Cryothérapie quotidienne"}, {"day": 2, "done": true, "label": "Repos actif — vélo"}, {"day": 4, "done": false, "label": "Injection anti-inflammatoire"}, {"day": 5, "done": false, "label": "Feu vert médecin"}], "riskAfterReturn": 45, "recoveryTimeline": [{"day": "J0", "fitness": 55}, {"day": "J1", "fitness": 60}, {"day": "J3", "fitness": 70}, {"day": "J4", "fitness": 78}, {"day": "J5", "fitness": 84}]}]}	2026-06-25 15:37:50.904	2026-06-25 15:37:50.904
249e8c02-137e-417c-9616-2695d63db16c	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	transfer	{"transfers": [{"id": "t1", "age": 23, "club": "ES Tunis", "cost": "1.2M€", "name": "Hamza Lahmar", "risk": "Faible", "speed": 90, "reason": "Profil similaire Ahmed Ben Salah · Faible fatigue · xG élevé", "vision": 76, "xgGain": "+14%", "stamina": 78, "contract": "18 mois", "position": "BU", "ppiScore": 87, "pressing": 84, "dribbling": 82, "nationality": "TUN", "compatibility": 89}, {"id": "t2", "age": 25, "club": "Club Africain", "cost": "850K€", "name": "Ramzi Fejlaoui", "risk": "Faible", "speed": 76, "reason": "Vision de jeu · Compatible Karim Dridi · Leadership", "vision": 82, "xgGain": "+9%", "stamina": 85, "contract": "12 mois", "position": "MC", "ppiScore": 81, "pressing": 88, "dribbling": 70, "nationality": "TUN", "compatibility": 82}, {"id": "t3", "age": 27, "club": "US Monastir", "cost": "600K€", "name": "Yassine Bouali", "risk": "Moyen", "speed": 74, "reason": "Solide défensivement · Bon pressing haut · Contrat court", "vision": 68, "xgGain": "+6%", "stamina": 88, "contract": "6 mois", "position": "DD", "ppiScore": 76, "pressing": 75, "dribbling": 60, "nationality": "TUN", "compatibility": 78}, {"id": "t4", "age": 21, "club": "Sfax CS", "cost": "380K€", "name": "Fares Chammam", "risk": "Moyen", "speed": 82, "reason": "Jeune talent · Excellent xG · Potentiel élevé", "vision": 85, "xgGain": "+11%", "stamina": 73, "contract": "24 mois", "position": "MOC", "ppiScore": 72, "pressing": 71, "dribbling": 80, "nationality": "TUN", "compatibility": 74}, {"id": "t5", "age": 24, "club": "Étranger", "cost": "2.1M€", "name": "Bilel Ifa", "risk": "Élevé", "speed": 92, "reason": "Meilleure compatibilité équipe · Vitesse exceptionnelle · Boost xG immédiat", "vision": 79, "xgGain": "+18%", "stamina": 81, "contract": "36 mois", "position": "AG", "ppiScore": 90, "pressing": 87, "dribbling": 89, "nationality": "TUN", "compatibility": 91}]}	2026-06-25 15:37:50.904	2026-06-25 15:37:50.904
4e6621f1-e9ca-491c-815f-93233b51cf69	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	market-value	{"values": [{"m3": "2.8M€", "m6": "3.5M€", "player": "Ahmed Ben Salah", "current": "2.3M€", "factors": [{"label": "Performance", "score": 92}, {"label": "Âge", "score": 85}, {"label": "Minutes", "score": 78}, {"label": "Buts", "score": 88}, {"label": "Passes D.", "score": 72}]}, {"m3": "2.1M€", "m6": "2.4M€", "player": "Ali Mansouri", "current": "1.8M€", "factors": [{"label": "Performance", "score": 84}, {"label": "Âge", "score": 80}, {"label": "Minutes", "score": 82}, {"label": "Buts", "score": 65}, {"label": "Passes D.", "score": 91}]}]}	2026-06-25 15:37:50.904	2026-06-25 15:37:50.904
58412804-ae42-40f9-b196-ecc502566fae	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	scouting	{"compare": {"external": {"ovr": 86, "club": "Al Arabi", "name": "Youssef Msakni", "speed": 86, "physical": 78, "potential": 87, "technique": 88}, "internal": {"ovr": 88, "name": "Ahmed Ben Salah", "speed": 88, "physical": 82, "potential": 90, "technique": 85}, "similarity": 89, "similarPlayers": [{"club": "Al Arabi", "name": "Youssef Msakni", "match": 89}, {"club": "CSS", "name": "Hamza Lahmar", "match": 82}, {"club": "Montpellier", "name": "Wahbi Khazri", "match": 78}, {"club": "Zamalek", "name": "Seifeddine Jaziri", "match": 75}, {"club": "Sheffield Utd", "name": "Anis Ben Slimane", "match": 72}, {"club": "Al Ettifaq", "name": "Hamdi Harbaoui", "match": 68}, {"club": "Espérance", "name": "Taha Yassine Khenissi", "match": 65}, {"club": "Monastir", "name": "Ayman Dahmen", "match": 62}, {"club": "Sfax", "name": "Mohamed Ali Moncer", "match": 58}, {"club": "CA Bizertin", "name": "Nader Ghandri", "match": 55}]}}	2026-06-25 15:37:50.904	2026-06-25 15:37:50.904
d712c5ba-ab6b-42f7-acf0-15e6f41ab44e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	evolution	{"forecasts": [{"metric": "Vitesse", "player": "Ahmed Ben Salah", "current": 88, "history": [{"month": "Jan", "value": 84}, {"month": "Fév", "value": 85}, {"month": "Mar", "value": 86}, {"month": "Avr", "value": 87}, {"month": "Mai", "value": 87}, {"month": "Juin", "value": 88}, {"month": "Juil", "value": 91, "predicted": true}, {"month": "Sep", "value": 94, "predicted": true}], "forecast30": 91, "forecast90": 94}, {"metric": "Endurance", "player": "Ali Mansouri", "current": 88, "history": [{"month": "Jan", "value": 82}, {"month": "Fév", "value": 84}, {"month": "Mar", "value": 85}, {"month": "Avr", "value": 86}, {"month": "Mai", "value": 87}, {"month": "Juin", "value": 88}, {"month": "Juil", "value": 90, "predicted": true}, {"month": "Sep", "value": 92, "predicted": true}], "forecast30": 90, "forecast90": 92}]}	2026-06-25 15:37:50.904	2026-06-25 15:37:50.904
a08bf212-8bfb-4a51-9ae3-72e310da2044	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	training	{"plan": [{"day": "Lundi", "type": "cardio", "session": "Cardio", "intensity": "Moyenne"}, {"day": "Mardi", "type": "repos", "session": "Repos", "intensity": "Basse"}, {"day": "Mercredi", "type": "explosivite", "session": "Explosivité", "intensity": "Haute"}, {"day": "Jeudi", "type": "force", "session": "Force", "intensity": "Moyenne"}, {"day": "Vendredi", "type": "tactique", "session": "Tactique", "intensity": "Moyenne"}], "banner": "Programme généré pour Ahmed Ben Salah — fatigue 85%, hamstring en surveillance, match samedi."}	2026-06-25 15:37:50.904	2026-06-25 15:37:50.904
\.


--
-- Data for Name: BudgetCategory; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."BudgetCategory" ("id", "organizationId", "name", "allocated", "spent", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ClubAuditLog; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."ClubAuditLog" ("id", "organizationId", "userName", "userRole", "action", "entity", "details", "type", "ipAddress", "createdAt") FROM stdin;
847d3225-117b-4c00-b2b1-8d8a063c513a	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.78.216	2026-06-24 15:15:05.714
bec0ebaa-3a27-4aca-872b-b24a334d4887	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Ajout joueur	wahbi kharsri	Poste: mc	CREATION	197.17.78.216	2026-06-24 15:16:01.014
8764f518-868b-478a-823b-c0a1775cee68	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Ajout joueur	ilbab	Poste: st	CREATION	197.17.78.216	2026-06-24 15:18:04.427
0e7e2480-7669-4716-8ccb-3f001bcc5133	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.78.216	2026-06-24 15:27:07.124
d999d5b1-c35d-45da-b9d8-45afb364fc99	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.78.216	2026-06-24 15:51:12.537
085f0468-ab5f-4831-90a9-601c3de99568	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Ajout utilisateur	momen dali	Rôle: Responsable	CREATION	197.17.78.216	2026-06-24 16:06:43.743
6bda9b93-c6f4-4a87-af03-933ca2f9439e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.78.216	2026-06-24 16:15:47.389
4fcb9f01-c408-4aaa-a1a6-81d75d5ded87	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Ajout utilisateur	ccc	Rôle: Responsable	CREATION	197.17.78.216	2026-06-24 16:16:10.973
ceba732c-cf78-40cd-bc10-1c830dab7e63	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.78.216	2026-06-24 16:22:07.86
a31a3fd7-9898-4257-9428-b3ebdd9dd001	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Suppression utilisateur	ccc	Compte supprimé	SUPPRESSION	197.17.78.216	2026-06-24 16:27:06.004
64faa369-3753-4294-a9c3-2d3054f69ced	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Suppression utilisateur	momen dali	Compte supprimé	SUPPRESSION	197.17.78.216	2026-06-24 16:27:09.151
ae68fe07-cd30-4c48-a09a-eb7d093c9a95	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Ajout utilisateur	cc	Rôle: Responsable	CREATION	197.17.78.216	2026-06-24 16:27:44.362
3c9d36f2-9f62-4595-be08-16505f375578	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.78.216	2026-06-24 16:43:34.429
dd734b43-47b5-485b-8d4a-9982f012b6a5	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	196.187.133.84	2026-06-24 16:53:44.847
5f9d2f40-04a5-43dc-88f4-b180a408cac6	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Activation compte utilisateur	res	Rôle: Responsable — compte de connexion activé	CREATION	197.17.78.216	2026-06-24 16:54:11.955
6f0f9c48-94c2-4528-8503-6e8ac0748471	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.78.216	2026-06-24 16:54:31.621
80e10bea-0bb8-41dd-b492-cd1797cd0caa	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	196.187.133.84	2026-06-24 16:55:24.207
f8bb40a9-c161-4742-9412-41f8ce8d2fbf	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	res	Responsable	Connexion	—	Connexion réussie	CONNEXION	197.17.78.216	2026-06-24 16:56:22.552
63b14839-68b1-4126-a95d-5f9aeb5fb165	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	196.187.133.84	2026-06-24 16:58:27.873
810d5625-62a4-4445-8baf-360f7b5b70c5	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Ajout utilisateur	rocco	Rôle: Coach — compte de connexion créé	CREATION	196.187.133.84	2026-06-24 17:02:51.28
388baa52-8e42-4308-8527-82ba5f4225a6	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	196.187.133.84	2026-06-24 17:05:09.973
5aa4b5d9-25aa-456f-a60b-0e0c070f82eb	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	rocco	Coach	Connexion	—	Connexion réussie	CONNEXION	196.187.133.84	2026-06-24 17:05:49.064
636fdeaf-6d86-4559-9fd4-791c25cb178e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	196.187.133.84	2026-06-24 17:06:09.864
f059bd95-b145-4e70-a3f0-9089b17e27e5	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.78.216	2026-06-24 21:39:49.13
9e8627e7-e41c-4ebc-8ef0-caf3c0a26417	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Modification staff	hachani	Rôle: Scout	MODIFICATION	197.17.78.216	2026-06-25 00:05:33.105
321d392b-2405-474e-bcb2-5f03e8746728	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Transaction financière	coatch	Dépense — 40 000 DT	CREATION	197.17.78.216	2026-06-25 00:13:28.419
54d39f1b-6ccc-44a4-9eaf-193b22188199	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Ajout utilisateur	ilbab	Rôle: Joueur — compte de connexion créé	CREATION	197.17.78.216	2026-06-25 01:25:49.783
93f4046e-095a-4ec9-929d-17a51d8d42b2	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbab	Joueur	Connexion	—	Connexion réussie	CONNEXION	197.17.78.216	2026-06-25 01:26:16.204
44fe5c29-464c-4d3c-bc3e-4606ef9712ce	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.78.216	2026-06-25 01:26:48.906
265e71ca-b088-49e3-86a3-0256c65c9981	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.78.216	2026-06-25 12:50:38.6
95130f75-dd78-4c5e-ba7a-acd72731fa7d	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Ajout utilisateur	hachani mohamed said	Rôle: Analyste Performance — compte de connexion créé	CREATION	197.17.78.216	2026-06-25 12:52:34.876
cea9bcb9-1158-4773-a3fa-965754fad289	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachani mohamed said	Analyste Performance	Connexion	—	Connexion réussie	CONNEXION	197.17.78.216	2026-06-25 12:52:58.365
e6b8b58e-1a9d-4695-826e-0feaf027bbf8	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.78.216	2026-06-25 16:21:59.815
581e0fa6-6c5a-42e2-adc8-dbde0fe16c61	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Ajout utilisateur	hachaniResp	Rôle: Responsable — compte de connexion créé	CREATION	197.17.78.216	2026-06-25 16:22:49.805
8989a1da-a242-4156-aaed-9f47c4bfdf52	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachaniResp	Responsable	Connexion	—	Connexion réussie	CONNEXION	197.17.78.216	2026-06-25 16:23:06.167
d1cb1f87-6389-4627-a5a8-cf4c1a76dc7d	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbab	Joueur	Connexion	—	Connexion réussie	CONNEXION	102.104.236.103	2026-06-25 18:39:05.721
aed461be-d6c2-4ad1-bb5d-7802e2f90f1b	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.75.119	2026-06-25 19:13:49.786
e2b44e69-fa6d-451b-9001-c2cf9c4f5ae7	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.75.119	2026-06-25 19:25:04.377
4b9a3b64-447c-4b71-866d-429536b56612	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.75.119	2026-06-25 19:26:17.187
7c416405-b5c7-45ec-bd9c-b335a56d808e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachaniResp	Responsable	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-06-30 21:22:39.264
903f9273-f246-479a-8db6-888e762bc835	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Suppression utilisateur	hachani mohamed said	Compte supprimé	SUPPRESSION	197.17.75.119	2026-06-25 19:27:01.565
e00bec50-7326-4bcd-bb66-9a4e650e45c5	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Ajout utilisateur	hachani mohamed	Rôle: undefined — compte de connexion créé	CREATION	197.17.75.119	2026-06-25 19:28:10.917
5522776d-f46f-4941-845a-5357a67455dd	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachani mohamed	Coach	Connexion	—	Connexion réussie	CONNEXION	197.17.75.119	2026-06-25 19:28:26.457
00c6dc8d-f80c-4151-8626-cc2bfb3e072f	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.75.119	2026-06-25 19:28:53.87
6fa9f739-8167-4e52-81ba-fc7811fef5c6	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Suppression utilisateur	hachani mohamed	Compte supprimé	SUPPRESSION	197.17.75.119	2026-06-25 19:29:09.737
710cd2e6-1b7a-4e36-b220-c9b644c2f901	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Ajout utilisateur	hachanianaly	Rôle: Analyste Performance — compte de connexion créé	CREATION	197.17.75.119	2026-06-25 19:29:32.187
3784197d-a1d3-4f63-a66d-f426904bcd37	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachanianaly	Analyste Performance	Connexion	—	Connexion réussie	CONNEXION	197.17.75.119	2026-06-25 19:29:54.273
ed5cf6f1-b02e-4f21-bdf1-33a56aee8e9d	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachanianaly	Analyste Performance	Connexion	—	Connexion réussie	CONNEXION	197.17.75.119	2026-06-25 19:34:31.467
28949398-8ae2-44a4-b0eb-78a49ddb4bdd	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.75.119	2026-06-25 19:41:22.48
96a236c2-c7ad-4cc8-810e-5e422d9f3504	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Ajout utilisateur	azizpreparteurphysique	Rôle: Préparateur Physique — compte de connexion créé	CREATION	197.17.75.119	2026-06-25 19:42:35.116
3ba64a2e-5e92-46a7-ac95-41ebf19afcb0	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	197.17.75.119	2026-06-25 19:51:54.559
cc449e0a-a7fc-4c49-b9ab-98ebb1f4e4de	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.75.119	2026-06-25 20:04:47.87
5b9d4104-ae0d-4048-9094-33897ece7fd5	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.75.119	2026-06-25 20:35:15.701
b5ecbe97-605e-4f0f-8ce3-64cb0ee5299b	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	197.17.75.119	2026-06-25 20:36:36.575
d1fd3a98-b652-42ef-9d0e-7887f9202b94	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbab	Joueur	Connexion	—	Connexion réussie	CONNEXION	102.152.208.80	2026-06-25 20:48:03.987
bab008e8-bbd9-488e-8e87-a1498700dc12	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Ajout utilisateur	roccofina	Rôle: Finance — compte de connexion créé	CREATION	197.17.75.119	2026-06-25 20:55:18.276
276e4a33-e4d3-4f3e-82bc-3ecc092057ce	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.75.119	2026-06-25 20:57:13.996
7e607822-deec-4bff-aebe-290443106f3f	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-25 21:23:15.728
b8f31183-7a11-4bdb-a171-49411867e499	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-25 21:33:17.08
e5a27f84-7e05-4a40-b54e-976308bda3d1	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-25 21:33:25.297
942b067b-97b4-40ed-b6a6-1ddbfb889d0c	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-25 21:34:23.763
64674641-69c5-442e-933b-1d6db760e670	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.78.216	2026-06-25 22:16:21.875
5165976a-95b7-48b1-b1ac-872af2efeae1	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Ajout utilisateur	asmaMed	Rôle: Médecin — compte de connexion créé	CREATION	197.17.78.216	2026-06-25 22:17:59.8
10f51149-0de4-4659-909c-59b0be85ba8f	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	asmaMed	Médecin	Connexion	—	Connexion réussie	CONNEXION	197.17.78.216	2026-06-25 22:18:35.255
0dbc668b-97e5-4c0e-9a7f-5414e2b0d56e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.78.216	2026-06-25 22:37:47.343
d6ea5d1b-d44a-4422-b5f7-1e5fcd3a5647	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-25 23:10:56.771
960edc9e-fbb5-41f8-b273-020fbbe87403	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	asmaMed	Médecin	Connexion	—	Connexion réussie	CONNEXION	41.230.130.158	2026-06-26 00:14:30.816
08a60f92-fdaa-4a14-ba1f-65884feb4d5e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-26 00:21:06.329
aec2c63b-c51a-437b-94b7-562e3c11c000	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-26 00:45:07.092
ffc92e1b-b4d5-4d63-abd8-5a7cc5aacb92	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-26 00:48:42.044
f8beb23c-1d35-4fac-8d8e-275220df4c4e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-26 01:02:17.796
43c49831-fb84-4e2f-80f7-7fb34d74237d	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-26 01:05:52.087
c45b6fb4-c2ea-4dd7-966e-d2b580cd590c	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-26 01:08:56.827
352f4b6c-92dc-4f7f-9ae8-50b2fe1c5b39	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-26 01:33:00.884
dec04290-ff01-4f1d-ac77-eff2c53962b3	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-26 01:41:22.424
ee20c6de-852f-4925-9b9b-9626f5692756	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbab	Joueur	Connexion	—	Connexion réussie	CONNEXION	102.152.209.28	2026-06-26 01:46:13.214
2841c623-e0ed-4b9c-9fab-04c0358a07a4	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-26 01:53:21.29
b564e1ee-d8b7-4882-a6f3-5e1f10d8280a	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-26 01:56:04.81
0fa457b3-65d8-418b-a64e-4a0948ec8f21	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-26 01:56:35.948
514a951b-1194-4f68-a841-b5369b388442	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-26 01:59:37.958
5da4a0fa-91b1-4198-8d05-63ccaecff0bd	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-26 02:00:29.866
afe52e0e-0978-476c-a479-013373f04469	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-26 02:06:42.368
697ec04f-4a54-4ab0-afa4-9640bd4bf1d7	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-26 02:07:09.897
ef53c55b-768b-4185-8c6e-35eb6ba103e3	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-26 02:07:30.871
637fe0e0-189d-49a4-8956-2e2660c281e9	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-26 02:08:17.084
8555bf8e-74ab-44e6-8b1d-e4b9c83b4af0	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-26 02:09:38.284
33901111-286a-4a33-b2c0-ba2e0d96524f	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-26 02:10:23.021
c87310b7-c2ea-4627-8f98-8ed3157660f3	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	roccofina	Finance	Connexion	—	Connexion réussie	CONNEXION	102.152.209.28	2026-06-26 02:16:35.032
0617aa2d-b365-441c-bd77-93e5e1e21223	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-26 02:22:27.83
e8d6f673-4c07-46cf-84eb-bb2b3b6fa81e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	roccofina	Finance	Connexion	—	Connexion réussie	CONNEXION	102.152.209.28	2026-06-26 08:19:45.764
6637196a-e0f0-4852-a237-46bfb58d3341	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbab	Joueur	Connexion	—	Connexion réussie	CONNEXION	102.152.209.28	2026-06-26 12:58:36.828
c96904de-8701-4cd8-b18a-95d76f6cb9eb	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	roccofina	Finance	Connexion	—	Connexion réussie	CONNEXION	102.152.209.28	2026-06-26 13:29:47.23
46c2da8c-caa2-4425-ad56-a3729d02fedf	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.76.31	2026-06-26 13:46:41.937
97b0519e-e573-4e82-ae17-f55f63a47f22	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachanianaly	Analyste Performance	Connexion	—	Connexion réussie	CONNEXION	197.17.76.31	2026-06-26 13:47:21.429
6cd0f528-962c-4bbb-b2b3-6e9d984e5822	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.76.31	2026-06-26 14:00:33.62
72969b49-b1d7-45c4-b58b-7038544aedca	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.76.31	2026-06-27 10:22:46.372
99f3a947-a815-4672-b646-1d4f5ea29641	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.76.31	2026-06-27 10:24:18.685
bc6bd4c2-49f7-4fe2-a1e8-a9c09269ed3d	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	res	Responsable	Connexion	—	Connexion réussie	CONNEXION	197.17.76.31	2026-06-27 10:25:28.767
9ffa6efd-24a3-459e-b422-ea60b90ca65d	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	res	Responsable	Connexion	—	Connexion réussie	CONNEXION	197.17.76.31	2026-06-27 12:14:45.343
25784488-a4c9-484d-82e2-3c650b98a0af	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	res	Club Admin	Création contrat	ilbab	Fin: 12/07/2026	CREATION	197.17.76.31	2026-06-27 12:41:04.434
f214c9c9-ff8f-4902-bf0a-3c132993d31e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	res	Club Admin	Création contrat	wahbi kharsri	Fin: 10/07/2026	CREATION	197.17.76.31	2026-06-27 12:41:28.339
30efb492-9b3d-4d88-9762-442c5717a3bf	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	res	Responsable	Validation Validé	Recrutement joueur	Prospect jeune — validation scouting requise	MODIFICATION	197.17.76.31	2026-06-27 12:48:35.93
d929dde2-c0e6-424e-85bd-e9b40b2f36ee	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	res	Responsable	Ajout prospect	hachhh	ST	CREATION	197.17.76.31	2026-06-27 12:51:00.319
65973831-09a7-49ce-9eb8-afcbc23978d2	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	res	Responsable	Ajout prospect	neji	ST	CREATION	197.17.76.31	2026-06-27 12:54:15.273
9060730f-9b6d-4449-a74a-82e1342db806	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.76.31	2026-06-27 20:36:20.252
945373f1-b521-4ec7-a343-2736045ee194	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Ajout utilisateur	ilbabscout	Rôle: Scout — compte de connexion créé	CREATION	197.17.76.31	2026-06-27 20:38:04.995
ea432533-4a14-48d5-b2f9-95ffccf9f458	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbabscout	Scout	Connexion	—	Connexion réussie	CONNEXION	197.17.76.31	2026-06-27 20:38:22.004
2b1cd60a-82bd-4708-a934-aba16c7f625a	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbab	Joueur	Connexion	—	Connexion réussie	CONNEXION	102.152.215.78	2026-06-27 22:06:21.145
74385553-a8ea-44d9-85ee-035168c7be32	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.76.31	2026-06-27 22:25:53.75
d00a4a63-bb7d-45ba-b1c3-b7de50fedfae	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Ajout utilisateur	recuaziz	Rôle: Recruteur — compte de connexion créé	CREATION	197.17.76.31	2026-06-27 22:26:45.244
c18e3207-8a7c-4372-a06c-979aea31c77e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachanianaly	Analyste Performance	Connexion	—	Connexion réussie	CONNEXION	197.26.195.147	2026-06-28 14:11:59.284
5f1de97f-4e98-4222-bd15-a4a4f37eb955	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachanianaly	Analyste Performance	Connexion	—	Connexion réussie	CONNEXION	41.226.161.153	2026-06-28 16:55:40.553
008ddda2-0897-43dd-a2ff-9987f4c58a60	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.76.31	2026-06-28 20:09:47.383
34760133-a4ba-4dab-8c08-1e745b881488	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	rocco	Coach	Connexion	—	Connexion réussie	CONNEXION	197.17.76.31	2026-06-28 20:10:31.3
64e51630-4fd2-4541-b91d-61a1a1e89377	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.76.31	2026-06-28 20:21:19.681
e1de2c5a-336a-4ed5-b204-51af9e5293f5	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	asmaMed	Médecin	Connexion	—	Connexion réussie	CONNEXION	197.3.85.249	2026-06-28 20:34:55.787
8982d60f-a39e-4d13-b3dd-fcf917911ad9	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	rocco	Coach	Connexion	—	Connexion réussie	CONNEXION	197.3.85.249	2026-06-28 20:36:07.191
ae919923-5c49-40fa-a3be-a922fc0a1265	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	roccofina	Finance	Connexion	—	Connexion réussie	CONNEXION	196.178.35.200	2026-06-30 13:39:34.749
14ba6b80-50f5-490c-9545-d917f7a7843e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-06-30 20:54:30.35
27df68f4-2944-48d8-8e57-1cdbde1831b3	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-06-30 21:14:43.101
3b5319ab-3d18-4327-84c0-9d46b557dbc1	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-06-30 21:23:52.518
1b3e5503-e939-47e6-b9a1-e22faaca6ede	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachaniResp	Responsable	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-06-30 21:41:38.375
214b3caa-227e-4fc1-84b9-fcef5bd050ac	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-06-30 21:41:59.894
0a36cea0-ffc1-4b1d-b12c-3d3abf63b2ac	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	recuaziz	Recruteur	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-06-30 21:43:21.956
62d89e43-6aaa-4c16-b38b-130f916ed9a9	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	rocco	Coach	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-06-30 22:06:50.475
a1c45fb6-f752-465e-b5c1-3d611c1c3b44	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	asmaMed	Médecin	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-06-30 22:15:58.897
bc48f851-237f-4dad-8410-9ef079e320b6	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-06-30 22:43:21.763
92d163a5-09fc-465f-9dc9-0ed46f7885cf	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbabscout	Scout	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-06-30 22:44:56.266
e8ff75c9-af61-44f7-801f-ea3ca747ca66	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbab	Joueur	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-06-30 23:15:02.171
527dc1e0-c547-431d-8f0a-76ac5b2ed057	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	recuaziz	Recruteur	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-06-30 23:26:34.425
a28a7702-28d6-411c-80c0-7c556d2fcf42	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-06-30 23:29:59.667
5f8b1c41-15ad-4c40-a571-1e0e92ef2c2a	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	roccofina	Finance	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-06-30 23:30:27.72
c62d32db-e7f7-4bc9-a70d-629a151fb223	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	rocco	Coach	Connexion	—	Connexion réussie	CONNEXION	196.187.128.0	2026-07-01 10:25:23.309
0a453a87-e87e-4f41-ab43-9896696d10e8	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	196.187.128.0	2026-07-01 10:26:48.511
093c22cf-5bbd-40a8-a433-b90bae10fe7b	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbabscout	Scout	Connexion	—	Connexion réussie	CONNEXION	196.187.128.0	2026-07-01 10:27:51.372
859a2960-7c4e-4042-880f-867e572a570f	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	196.187.128.0	2026-07-01 11:03:07.517
7ac3c088-3e66-43af-a4d0-4ef6175ce889	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	196.187.128.0	2026-07-01 11:15:41.579
2c67a99e-fb95-440c-88aa-72714df5e723	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbabscout	Scout	Connexion	—	Connexion réussie	CONNEXION	196.187.128.0	2026-07-01 11:16:20.173
22887cfa-1d51-4670-b842-a9c30d8d8889	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachanianaly	Analyste Performance	Connexion	—	Connexion réussie	CONNEXION	197.26.195.147	2026-07-01 16:20:13.647
56c4664e-7989-498d-b3aa-41551c5e3e51	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachanianaly	Analyste Performance	Connexion	—	Connexion réussie	CONNEXION	197.26.195.147	2026-07-01 16:21:42.444
5c7c8443-2f6d-4d14-ab65-737dca74d515	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbab	Joueur	Connexion	—	Connexion réussie	CONNEXION	196.187.153.60	2026-07-01 18:59:05.254
3a1ca2b0-4e04-4435-8e04-f1130077f5db	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	roccofina	Finance	Connexion	—	Connexion réussie	CONNEXION	196.187.153.60	2026-07-01 19:00:59.48
c98ba2f3-b1c0-4dcc-93f0-91f3527f9fb7	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-01 23:57:24.497
d047e1ae-1f72-4431-bf8e-57a3d9171fc5	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachaniResp	Responsable	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-01 23:58:51.394
7b70d4b2-7fb7-4f71-ada8-ce708108e8fe	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-02 00:26:09.786
af778686-676a-4476-9b20-1e9435dc77b4	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-02 00:26:37.344
270cfa73-15eb-4094-bab8-b2cd16174564	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbabscout	Scout	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-02 00:27:49.732
04541a2c-81ad-4c6d-99d6-92fb19812026	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-02 00:34:40.657
c4795d38-4888-4dee-b543-f631852c6329	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	roccofina	Finance	Connexion	—	Connexion réussie	CONNEXION	196.187.153.60	2026-07-02 00:39:05.22
c90ff88f-4e73-4ec9-bfb4-c54eccb2df34	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachanianaly	Analyste Performance	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-02 00:54:00.718
4a9b311c-2b4e-4126-b958-de078f0ca367	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-02 01:11:33.627
1751723f-0fee-44fd-9869-331778fc7878	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachanianaly	Analyste Performance	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-02 01:30:41.551
fc823637-1772-407a-84cd-03c54abe8437	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	asmaMed	Médecin	Connexion	—	Connexion réussie	CONNEXION	196.187.153.60	2026-07-02 12:37:42.635
93e67056-afaa-4d4f-ae4c-4706a5c9279c	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	asmaMed	Médecin	Connexion	—	Connexion réussie	CONNEXION	196.187.153.60	2026-07-02 12:37:46.539
8f8a4ec4-2e95-40db-951e-6d735fedfac6	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbab	Joueur	Connexion	—	Connexion réussie	CONNEXION	196.187.153.60	2026-07-02 12:39:38.144
de59d86a-ce3b-417a-b0e5-5afdc965d8bf	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachanianaly	Analyste Performance	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-07-02 18:09:13.662
8e11e603-7be5-4d97-a6f2-4f0a7d8d4901	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-07-04 02:19:16.054
582d522b-1af6-4651-8223-6e16f8729cb0	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	196.179.222.80	2026-07-04 13:14:09.51
cd147ab0-ff60-4d73-bce7-0802d6e170a0	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachanianaly	Analyste Performance	Connexion	—	Connexion réussie	CONNEXION	196.179.222.80	2026-07-04 13:15:04.585
175f7f59-f575-4cfb-b673-24693e357226	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	196.179.222.80	2026-07-04 13:25:01.383
5b5033d3-11f0-46b5-a391-94aff123486f	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	rocco	Coach	Connexion	—	Connexion réussie	CONNEXION	196.179.222.80	2026-07-04 13:25:42.337
19f9ba65-c88f-4a12-90bc-f8fd13ecc605	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	102.29.213.211	2026-07-04 13:38:51.439
57b2fe48-3468-46f5-8ef7-267e82c63410	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	196.179.222.80	2026-07-04 19:19:30.487
fec4e440-681b-41f0-bdf1-d81041ab741d	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	roccofina	Finance	Connexion	—	Connexion réussie	CONNEXION	102.104.164.26	2026-07-04 22:09:17.914
88f66324-6ff2-4866-9f7b-f2598974a58c	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	rocco	Coach	Connexion	—	Connexion réussie	CONNEXION	197.0.99.73	2026-07-05 00:11:46.297
0dc9359a-2e94-4ab4-b070-1b80c8b0fd6b	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	rocco	Coach	Connexion	—	Connexion réussie	CONNEXION	197.0.99.73	2026-07-05 00:23:07.398
1fd23ead-7330-4f97-a62e-c7eac072ced4	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	asmaMed	Médecin	Connexion	—	Connexion réussie	CONNEXION	102.104.164.26	2026-07-05 14:15:20.822
0125ecc7-3dcb-4a59-8b3b-46c0b9c4cfcf	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	roccofina	Finance	Connexion	—	Connexion réussie	CONNEXION	102.104.164.26	2026-07-05 14:22:05.847
3c5d396e-1f7b-4d91-8a3f-5821da560b3a	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbab	Joueur	Connexion	—	Connexion réussie	CONNEXION	102.104.164.26	2026-07-05 14:27:55.446
00227577-6bb9-46be-b24b-ad9da891ea30	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	roccofina	Finance	Connexion	—	Connexion réussie	CONNEXION	196.187.151.189	2026-07-05 22:46:59.043
77003751-1df2-4e61-a77e-ce71144c24aa	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	asmaMed	Médecin	Connexion	—	Connexion réussie	CONNEXION	102.104.164.26	2026-07-05 22:52:58.927
4fe0f5db-de72-4cf2-8f4d-0b56867930bd	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-05 23:23:07.698
86dfbc73-8cc8-4c22-bf51-59463ad2ece2	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	rocco	Coach	Connexion	—	Connexion réussie	CONNEXION	197.17.23.70	2026-07-06 08:21:14.971
200334c1-49a9-4b20-84d1-1537ba58a0cf	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-06 08:54:18.387
10ad5109-9225-4d03-837e-9cf299dfc549	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	asmaMed	Médecin	Connexion	—	Connexion réussie	CONNEXION	102.156.84.215	2026-07-06 09:17:56.487
17bb3d5d-9758-4aa3-b53b-1a35bc788312	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	rocco	Coach	Connexion	—	Connexion réussie	CONNEXION	102.156.84.215	2026-07-06 09:33:09.22
fc283df4-3b12-4252-83cf-88d451a41ac0	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	roccofina	Finance	Connexion	—	Connexion réussie	CONNEXION	102.104.164.26	2026-07-06 09:56:43.183
a23bb7d6-6a17-442d-86f7-48754c45472e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbab	Joueur	Connexion	—	Connexion réussie	CONNEXION	102.104.164.26	2026-07-06 09:57:42.23
b59029db-59b4-4d49-9eb6-b4b0eb7eeb71	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	41.225.92.63	2026-07-06 10:00:52.872
b5a2ab06-f630-4816-9b68-399157f26f78	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-06 10:01:00.588
f5adcef3-f19b-4843-aad3-1d2dcd037be0	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachaniResp	Responsable	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-06 10:03:28.68
85ed3233-1013-43a0-bab5-81070bb9fbb2	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachaniResp	Responsable	Connexion	—	Connexion réussie	CONNEXION	41.225.92.63	2026-07-06 10:03:53.978
6b9053cd-b718-492b-b12b-ed12ac2b40ea	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	roccofina	Finance	Connexion	—	Connexion réussie	CONNEXION	102.104.164.26	2026-07-06 10:03:56.175
babe1a42-488d-4cfc-88ef-f2cc8f7c31e2	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbabscout	Scout	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-06 10:04:59.732
0f292749-19d5-4e22-b983-95789f0a22d3	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	asmaMed	Médecin	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-06 10:06:20.982
52eb7095-762f-4456-b295-6a328aa0c6e6	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	roccofina	Finance	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-06 10:07:28.482
7a27075f-b250-4580-828d-4dcd16945720	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	recuaziz	Recruteur	Connexion	—	Connexion réussie	CONNEXION	41.225.92.63	2026-07-06 10:08:00.493
41947abe-7f99-48da-8585-9f44f0b19140	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	asmaMed	Médecin	Connexion	—	Connexion réussie	CONNEXION	41.225.92.63	2026-07-06 10:09:38.374
c4c14f54-a6d3-4712-9aaa-ff5ee9a6aaec	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	197.244.154.246	2026-07-06 10:14:13.689
de18d896-1e2c-4a81-a1f9-c63bb05a89fb	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-06 10:17:59.582
7f82273d-3de2-4aa8-9f73-3c23c961007a	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachaniResp	Responsable	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-06 10:22:26.879
cd0e55bd-b0dc-4f23-8099-1e9987a7bd5a	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachanianaly	Analyste Performance	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-06 10:28:23.783
fb9e7601-beb7-4950-8449-be23fe0cebd6	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbabscout	Scout	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-06 10:34:36.836
0dfda7c7-171a-4781-bd53-a97965efa6f7	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	recuaziz	Recruteur	Connexion	—	Connexion réussie	CONNEXION	197.244.154.246	2026-07-06 11:00:27.987
d9f22611-4205-4633-a3d7-0261ad896671	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachanianaly	Analyste Performance	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-06 11:14:14.771
95b23c79-98dc-4105-967f-83949755bff1	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	recuaziz	Recruteur	Connexion	—	Connexion réussie	CONNEXION	41.225.102.14	2026-07-06 12:31:38.476
23669b42-8726-47d3-9ac5-d08693358b84	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	rocco	Coach	Connexion	—	Connexion réussie	CONNEXION	41.225.102.14	2026-07-06 12:35:38.981
5074e6e1-2f21-484d-823b-d198562d252d	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachanianaly	Analyste Performance	Connexion	—	Connexion réussie	CONNEXION	41.227.54.71	2026-07-06 12:40:43.583
67e2b1a4-6a47-4dd6-b427-29fc2e66a9e1	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachanianaly	Analyste Performance	Connexion	—	Connexion réussie	CONNEXION	41.225.208.69	2026-07-06 13:52:37.792
82b4b201-9e09-4014-b2f0-558fffebfe9c	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	Préparateur Physique	Connexion	—	Connexion réussie	CONNEXION	197.244.154.246	2026-07-06 14:12:56.39
c0740cb0-3b7c-4d07-b5c4-e6ad449e68eb	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachanianaly	Analyste Performance	Connexion	—	Connexion réussie	CONNEXION	197.15.128.13	2026-07-06 15:45:13.899
383e639c-499c-4ca9-8b7b-dd1d8ebc3be3	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachanianaly	Analyste Performance	Connexion	—	Connexion réussie	CONNEXION	197.15.128.13	2026-07-06 17:48:54.228
248c7e75-0bb2-46af-adeb-f9f1101ffceb	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachanianaly	Analyste Performance	Connexion	—	Connexion réussie	CONNEXION	41.225.176.64	2026-07-07 14:27:46.318
86209207-ec8b-4c9a-8700-92fef5c80b5e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	asmaMed	Médecin	Connexion	—	Connexion réussie	CONNEXION	41.225.176.64	2026-07-07 14:39:05.504
691410f2-fc8e-4534-8e47-c159b51795d9	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachaniResp	Responsable	Connexion	—	Connexion réussie	CONNEXION	41.225.176.64	2026-07-07 14:41:08.319
2a8b35fc-3b6f-42e2-a8d0-6d27f3e95726	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	41.225.176.64	2026-07-07 14:45:06.053
e2bddda3-8600-462e-8f2a-a5739c536fb9	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachanianaly	Analyste Performance	Connexion	—	Connexion réussie	CONNEXION	41.225.176.64	2026-07-07 14:51:24.203
3d558f88-10f2-4032-a090-324092dabfa6	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbab	Joueur	Connexion	—	Connexion réussie	CONNEXION	41.225.176.64	2026-07-07 14:58:45.885
9e7506dc-2a35-4298-99ce-5998249be793	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-10 14:10:35.776
626e2f60-aff6-4d2b-ba60-42c45a8747f9	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbabscout	Scout	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-10 14:11:25.779
fb922b11-ef19-4a84-acd2-be8a59b72590	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbabscout	Scout	Connexion	—	Connexion réussie	CONNEXION	41.226.161.153	2026-07-10 14:12:39.77
01c12038-09c9-4586-941d-e0372bd171ec	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbabscout	Scout	Connexion	—	Connexion réussie	CONNEXION	197.17.111.117	2026-07-10 14:16:06.742
91659ebb-8be3-41b2-ae09-841b66592017	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbabscout	Scout	Connexion	—	Connexion réussie	CONNEXION	41.226.161.153	2026-07-10 15:15:21.412
0f8d8d31-8bdd-47d2-8c81-cf228b7d4177	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachanianaly	Analyste Performance	Connexion	—	Connexion réussie	CONNEXION	41.226.161.153	2026-07-10 15:17:25.98
b7f8b3a2-c7e1-4495-985a-b9d483f60c12	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbabscout	Scout	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-11 09:17:11.821
b2c8372a-fffc-488e-8bd7-4038f70f8608	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	rocco	Coach	Connexion	—	Connexion réussie	CONNEXION	102.156.131.156	2026-07-11 10:58:14.644
dc16b85f-20a8-4592-a00e-5f2d6561aa85	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-11 14:15:26.846
67f577e9-58bb-4735-831e-24229941c3c3	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbabscout	Scout	Connexion	—	Connexion réussie	CONNEXION	197.17.22.161	2026-07-11 14:16:19.74
23611556-c6f7-4b72-a7cc-e188eb21099e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbab	Joueur	Connexion	—	Connexion réussie	CONNEXION	102.152.193.98	2026-07-11 15:10:53.858
7f62f256-d835-413a-87de-4f786781b7dd	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	rocco	Coach	Connexion	—	Connexion réussie	CONNEXION	102.156.131.156	2026-07-11 15:23:40.033
78f1a2a2-4fa0-4c73-a1dc-2c73aca5b2dd	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbab	Joueur	Connexion	—	Connexion réussie	CONNEXION	102.152.219.81	2026-07-11 15:35:58.632
fb2cae31-db26-4a84-99c4-1e47bb022316	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	rocco	Coach	Connexion	—	Connexion réussie	CONNEXION	102.156.131.156	2026-07-11 16:42:40.443
65a381dd-55dc-4915-a46f-528c3d97ad37	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	rocco	Coach	Connexion	—	Connexion réussie	CONNEXION	102.156.131.156	2026-07-11 16:42:46.127
bf484611-3765-408e-96f9-5170e3b99eaf	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	asmaMed	Médecin	Connexion	—	Connexion réussie	CONNEXION	102.156.131.156	2026-07-11 17:06:05.444
f49923ad-6d94-48fc-bdba-837ff33b66b1	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	recuaziz	Recruteur	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-07-11 18:36:10.466
f8c5dea5-cd70-4bc8-b355-767a67851793	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	rocco	Coach	Connexion	—	Connexion réussie	CONNEXION	102.156.131.156	2026-07-11 18:51:15.431
e7709885-36c5-4b26-ac88-db3b80a634c0	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	rocco	Coach	Connexion	—	Connexion réussie	CONNEXION	102.156.131.156	2026-07-11 20:21:18.767
cfe40bcb-161c-4d9a-8597-a17921b44840	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	rocco	Coach	Connexion	—	Connexion réussie	CONNEXION	102.156.131.156	2026-07-11 20:21:19.262
b2e1f448-a9ab-46ef-bdb4-657d2101d2b0	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	196.187.137.253	2026-07-12 08:41:54.423
5acd6737-9d89-43da-ba07-0b5f6e2c196d	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbabscout	Scout	Connexion	—	Connexion réussie	CONNEXION	196.187.137.253	2026-07-12 08:42:52.16
5167e8a3-0676-4f0c-bb26-4c559b50e148	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	asmaMed	Médecin	Connexion	—	Connexion réussie	CONNEXION	102.156.58.201	2026-07-12 11:05:53.071
f83835a7-0325-4d74-af7c-1e01618bacee	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	rocco	Coach	Connexion	—	Connexion réussie	CONNEXION	102.156.58.201	2026-07-12 11:05:53.932
9e7394ae-ed88-4d25-b07b-b622baa71720	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	196.187.137.253	2026-07-12 11:36:55.8
a2d4b3e9-b3fd-42cc-8533-8cd9c9df20dc	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	recuaziz	Recruteur	Connexion	—	Connexion réussie	CONNEXION	127.0.0.1	2026-07-12 17:46:55.421
e1bf49fa-a43d-4330-9586-89c936659ee8	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbab	Joueur	Connexion	—	Connexion réussie	CONNEXION	41.226.161.153	2026-07-13 18:55:40.425
4cf63f68-5801-4af4-b915-31e4ac96bad7	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbab	Joueur	Connexion	—	Connexion réussie	CONNEXION	41.226.161.153	2026-07-13 20:46:08.664
a7be4b38-8082-4c11-84f7-1827aa059b2b	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	asmaMed	Médecin	Connexion	—	Connexion réussie	CONNEXION	197.2.15.42	2026-07-14 11:10:29.055
9c8c7b01-a84a-43df-a616-7520883dec86	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbab	Joueur	Connexion	—	Connexion réussie	CONNEXION	102.29.206.53	2026-07-14 13:30:51.645
a4be475a-89b9-4fb0-b0f9-8f677587d63f	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	roccofina	Finance	Connexion	—	Connexion réussie	CONNEXION	102.29.206.53	2026-07-14 13:31:37.791
ba719001-0a9d-4883-a122-fb02b97c8f01	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	asmaMed	Médecin	Connexion	—	Connexion réussie	CONNEXION	102.156.192.181	2026-07-14 18:14:54.978
85d81e45-6113-4397-aaec-3ea3f8c25b2a	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	102.156.192.181	2026-07-14 18:17:36.977
680ec0a3-0895-44c7-bfa1-e215ed5fb001	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	asmaMed	Médecin	Connexion	—	Connexion réussie	CONNEXION	102.156.192.181	2026-07-14 18:19:38.674
83c125db-1d30-4efe-b204-57d1dc524ce7	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	102.156.192.181	2026-07-14 18:20:45.744
b87b39e8-7b45-4737-a390-2ad5cf17d879	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	asmaMed	Médecin	Connexion	—	Connexion réussie	CONNEXION	102.156.192.181	2026-07-14 18:23:20.427
2c8ceaa4-0264-4caa-9aff-d5671b008c6e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	asmaMed	Médecin	Connexion	—	Connexion réussie	CONNEXION	197.2.167.134	2026-07-15 00:19:07.426
f016fbdf-30c4-4d98-a5a2-2382faa5ffa5	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	rocco	Coach	Connexion	—	Connexion réussie	CONNEXION	197.2.167.134	2026-07-15 01:05:28.179
15051867-891c-417f-95da-536a32d01666	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	asmaMed	Médecin	Connexion	—	Connexion réussie	CONNEXION	102.157.63.36	2026-07-15 14:54:12.642
a59e72fb-3614-4a02-973f-f4080d75ec03	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	rocco	Coach	Connexion	—	Connexion réussie	CONNEXION	102.157.63.36	2026-07-15 15:20:04.405
3415ec44-5e48-4a27-a7a0-9314597c1603	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	196.187.132.49	2026-07-17 08:00:54.449
d5df858b-006c-4f6b-b79a-20d8bf02566f	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachaniResp	Responsable	Connexion	—	Connexion réussie	CONNEXION	196.187.132.49	2026-07-17 08:02:12.85
415b7703-62b8-44e1-af3a-9f7962d29b2d	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachaniResp	Responsable	Validation Validé	Recrutement joueur	Lamine Yamal — Ailier D · Barcelona	MODIFICATION	196.187.132.49	2026-07-17 08:03:11.927
9e9a5aa1-a840-4240-baa8-508f282a7b5a	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	196.187.132.49	2026-07-17 08:06:57.84
b72315e2-1781-4ae8-ba81-31019508d4c8	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	196.187.132.49	2026-07-17 08:26:39.771
e8667ce4-6d1a-4ee2-b05e-474e8ae8430f	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbabscout	Scout	Connexion	—	Connexion réussie	CONNEXION	196.187.132.49	2026-07-17 08:28:10.833
280e0778-fe7e-400c-b145-8e92cd005714	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.80.191	2026-07-17 09:36:11.441
054b412c-c8b8-4c66-b6ac-1f863a087e5a	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbabscout	Scout	Connexion	—	Connexion réussie	CONNEXION	197.17.80.191	2026-07-17 09:36:36.453
03600a94-a128-4188-863c-761812d93b5e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.80.191	2026-07-17 10:44:58.383
9d4d80fb-b14f-4062-984a-dfa0a4251d97	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbabscout	Scout	Connexion	—	Connexion réussie	CONNEXION	197.17.80.191	2026-07-17 10:46:23.675
a56ff9b5-1727-47aa-a9a6-4e7b1c3a489c	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Mohamed said Hachani	Club Admin	Connexion	—	Connexion réussie	CONNEXION	197.17.80.191	2026-07-17 12:07:42.422
c50741b1-1cde-4544-b067-c04dfdfa06d4	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachaniResp	Responsable	Connexion	—	Connexion réussie	CONNEXION	197.17.80.191	2026-07-17 12:09:56.759
\.


--
-- Data for Name: ClubCalendarEvent; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."ClubCalendarEvent" ("id", "organizationId", "title", "eventDate", "eventTime", "eventType", "location", "createdAt", "extraData", "notes") FROM stdin;
8f4ee81f-ed2b-42a7-a26b-72e9e2543291	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	munted vs bormuth	2026-06-28 00:00:00	14:00	MATCH	old trafold	2026-06-25 00:24:45.127	\N	\N
94b7d411-b54a-4f6a-b976-d8745d040147	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	test medical	2026-06-28 00:00:00	14:00	MEDICAL	dans le stade	2026-06-25 00:25:33.895	\N	\N
509a6e24-e130-48d9-ab6b-231c7642e55f	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	test	2026-06-26 00:00:00	09:00	MEDICAL	test	2026-06-26 01:33:46.03	\N	\N
ad0699ed-80b4-4731-83fc-5b08155d4ca0	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Rééducation — ilbab	2026-06-26 00:00:00	09:00	MEDICAL	\N	2026-06-26 01:44:26.81	\N	\N
b7cfcbc2-7022-452e-9c11-67c6e0be0b91	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Cardio endurance	2026-06-27 00:00:00	09:00	ENTRAINEMENT	\N	2026-06-26 01:53:22.673	\N	\N
f967571f-0efc-4f79-b105-bd9f364bf242	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Bilan médical complet — ilbab	2026-07-04 22:13:26.389	09:00	MEDICAL	Infirmerie du club	2026-06-27 22:13:26.905	\N	\N
55a6343d-3ba4-4274-a686-b25ff34d47f9	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Suivi blessure / kinésithérapie — ilbab	2026-07-04 22:15:34.372	09:00	MEDICAL	Infirmerie du club	2026-06-27 22:15:35.638	\N	\N
66046ff9-d318-4022-96a4-91b30763416d	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Observation Liam Delap — Ipswich vs Newcastle	2026-07-15 18:30:00	18:30	SCOUT	Portman Road, Ipswich	2026-07-11 10:17:02.219	{"seasonTag": "2026-2027-mu"}	Focus appels profondeur + duels aériens
52c40b67-4a8a-4b3b-bf4d-fb29116af7cc	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Tour scouting Scandinavie — Dorgu + jeunes DC	2026-07-22 08:00:00	08:00	SCOUT	Copenhague / Milan	2026-07-11 10:17:02.321	{"seasonTag": "2026-2027-mu"}	3 matchs sur 5 jours
02dc655c-15dc-4908-af8f-b7c48439030d	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Ajax — Carlos Forbs (derby)	2026-07-19 20:00:00	20:00	SCOUT	Johan Cruyff Arena, Amsterdam	2026-07-11 10:17:02.371	{"seasonTag": "2026-2027-mu"}	Rapport vidéo + live
dd1c3e21-d122-4eea-9d66-961d1945563e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Technique — pressing	2026-07-17 00:00:00	09:00	ENTRAINEMENT	terrain	2026-07-15 16:14:23.504	\N	\N
\.


--
-- Data for Name: ClubContract; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."ClubContract" ("id", "organizationId", "holderName", "startDate", "endDate", "salaryMonthly", "bonus", "releaseClause", "consumedPct", "createdAt", "updatedAt") FROM stdin;
8655709f-0967-49fb-8541-ccf8e499ac20	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachani	2026-06-14 00:00:00	2030-12-25 00:00:00	600	100	25	0	2026-06-25 00:18:58.982	2026-06-25 00:18:58.982
50df794c-5ea4-431c-9aae-70eb259a362a	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbab	2026-06-27 00:00:00	2026-07-12 00:00:00	99	0	\N	4	2026-06-27 12:41:03.589	2026-06-27 12:41:03.589
94462ae1-55af-4848-8df7-fefa26883e84	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	wahbi kharsri	2026-06-29 00:00:00	2026-07-10 00:00:00	10	0	\N	0	2026-06-27 12:41:27.769	2026-06-27 12:41:27.769
\.


--
-- Data for Name: ClubDashboardStats; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."ClubDashboardStats" ("id", "organizationId", "playersCount", "staffCount", "budgetRemaining", "payrollTotal", "injuredCount", "contractsToRenew", "budgetUsedPct", "budgetChart", "alerts", "aiSummary", "createdAt", "updatedAt") FROM stdin;
c61475ab-74ea-4bbe-871e-c69ddd265f95	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	2	2	0	45000	6	2	1000	[{"month": "Jan", "spent": 0, "budget": 0}, {"month": "Fév", "spent": 0, "budget": 0}, {"month": "Mar", "spent": 0, "budget": 0}, {"month": "Avr", "spent": 0, "budget": 0}, {"month": "Mai", "spent": 0, "budget": 0}, {"month": "Juin", "spent": 0, "budget": 0}, {"month": "Juil", "spent": 0, "budget": 0}, {"month": "Août", "spent": 0, "budget": 0}, {"month": "Sep", "spent": 0, "budget": 0}, {"month": "Oct", "spent": 0, "budget": 0}, {"month": "Nov", "spent": 0, "budget": 0}, {"month": "Déc", "spent": 0, "budget": 0}]	[{"text": "Bienvenue manchester united — commencez par ajouter vos joueurs et votre staff.", "type": "warning"}]	["2 joueur(s) dans l'effectif.", "2 membre(s) du staff.", "Budget utilisé à 1000%."]	2026-06-24 14:23:23.835	2026-07-17 12:57:07.261
\.


--
-- Data for Name: ClubDirectConversation; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."ClubDirectConversation" ("id", "organizationId", "participantAId", "participantBId", "lastMessageAt", "createdAt") FROM stdin;
10b50a7a-0170-4f56-956a-53981d24de50	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ade1688b-1e89-4d87-ac6e-b98482cb0fce	b4bfe835-8b7d-4f8d-ac97-766e23415441	2026-07-01 14:42:49.175	2026-07-01 14:42:42.744
97c4aa81-55ea-413c-9278-cfe169f64e8c	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	1d8e5771-163c-4200-8b7d-8222014d317f	af2366fa-c264-4ad3-878f-c764a1813a37	2026-07-02 00:31:27.582	2026-07-02 00:31:27.582
6f22d0ac-9014-49b5-a5f4-aa7d4e1c8046	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	af2366fa-c264-4ad3-878f-c764a1813a37	b4bfe835-8b7d-4f8d-ac97-766e23415441	2026-07-02 00:31:31.265	2026-07-02 00:31:31.265
36336845-f669-4822-b6d4-00adc07b2487	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ab3f63b2-c230-4855-8778-9c67a4385548	b4bfe835-8b7d-4f8d-ac97-766e23415441	2026-07-02 00:39:25.457	2026-07-01 23:55:38.171
e66c2fb2-1d46-4d2d-b23b-0c9a2f919a84	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	7d34def9-c968-4493-81aa-ac6cac17e1bb	bb02e87d-60f9-4984-bf13-846c9ee6b6b9	2026-07-02 12:38:16.76	2026-07-02 12:38:16.76
4d0b4322-30fa-4f08-809b-10e81d3d6f7a	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	7d34def9-c968-4493-81aa-ac6cac17e1bb	b4bfe835-8b7d-4f8d-ac97-766e23415441	2026-07-02 12:38:40.783	2026-07-02 12:38:20.296
0bb80504-1e00-4837-ba22-45741b801015	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	1d8e5771-163c-4200-8b7d-8222014d317f	ade1688b-1e89-4d87-ac6e-b98482cb0fce	2026-07-11 16:56:45.089	2026-07-11 16:56:44.989
\.


--
-- Data for Name: ClubDirectMessage; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."ClubDirectMessage" ("id", "conversationId", "senderMemberId", "body", "createdAt") FROM stdin;
446aeab1-94db-492c-92d0-c91713ebf19c	10b50a7a-0170-4f56-956a-53981d24de50	b4bfe835-8b7d-4f8d-ac97-766e23415441	bab aa	2026-07-01 14:42:49.175
a2de96ea-48f5-4a34-b082-9a9eee101eef	36336845-f669-4822-b6d4-00adc07b2487	b4bfe835-8b7d-4f8d-ac97-766e23415441	test said	2026-07-01 23:55:43.752
cf0add92-c95e-4fc3-a5d3-e79cbfcd48bb	36336845-f669-4822-b6d4-00adc07b2487	ab3f63b2-c230-4855-8778-9c67a4385548	📎 0a0a86b5-abae-4bc3-8c6c-cdc229438930.jpeg (177 Ko)	2026-07-02 00:00:42.903
575dc934-b9a9-4989-833b-d7835f870b99	36336845-f669-4822-b6d4-00adc07b2487	ab3f63b2-c230-4855-8778-9c67a4385548	😍😍😍😍	2026-07-02 00:00:53.635
15aedb14-7b60-4ce8-92f8-80488f2235cc	36336845-f669-4822-b6d4-00adc07b2487	b4bfe835-8b7d-4f8d-ac97-766e23415441	📎 Screenshot 2026-07-01 at 8.02.03 PM.png (27 Ko)	2026-07-02 00:01:01.738
47c58c02-41d4-4b69-a1b4-577fc6fd1f8c	36336845-f669-4822-b6d4-00adc07b2487	b4bfe835-8b7d-4f8d-ac97-766e23415441	__ATTACH__{"type":"image","url":"https://i.ibb.co/mrbfZ0R2/154cf91000da.png","name":"Screenshot 2026-07-01 at 8.02.03â¯PM.png","sizeKb":27}	2026-07-02 00:38:07.01
fa65baf1-a48e-43d0-a7e0-91210cf98e1b	36336845-f669-4822-b6d4-00adc07b2487	b4bfe835-8b7d-4f8d-ac97-766e23415441	__ATTACH__{"type":"image","url":"https://i.ibb.co/m5SRLr6n/7f7dd536f307.png","name":"Screenshot 2026-06-28 at 10.53.59â¯PM.png","sizeKb":90}	2026-07-02 00:39:25.457
78fea978-782f-4740-9e2f-db0f567a3c32	4d0b4322-30fa-4f08-809b-10e81d3d6f7a	7d34def9-c968-4493-81aa-ac6cac17e1bb	__ATTACH__{"type":"image","url":"https://i.ibb.co/tMCWJCs0/c52e58db92d3.png","name":"Screenshot 2026-06-25 at 7.42.13â¯PM.png","sizeKb":1122}	2026-07-02 12:38:40.783
7c6c3e00-3355-4216-98f2-08db254ecdb3	0bb80504-1e00-4837-ba22-45741b801015	1d8e5771-163c-4200-8b7d-8222014d317f	hello	2026-07-11 16:56:45.089
\.


--
-- Data for Name: ClubDirectMessageRead; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."ClubDirectMessageRead" ("id", "messageId", "memberId", "readAt") FROM stdin;
96445728-b16d-4848-8165-a06d289b1695	446aeab1-94db-492c-92d0-c91713ebf19c	ade1688b-1e89-4d87-ac6e-b98482cb0fce	2026-07-01 18:59:13.408
3a66bbd2-9ad5-441f-a884-992cccb91036	a2de96ea-48f5-4a34-b082-9a9eee101eef	ab3f63b2-c230-4855-8778-9c67a4385548	2026-07-01 23:59:55.393
ca649389-1daa-461c-b5d5-d31291eb2bb3	cf0add92-c95e-4fc3-a5d3-e79cbfcd48bb	b4bfe835-8b7d-4f8d-ac97-766e23415441	2026-07-02 00:00:50.144
052c5721-2eb8-40af-a0f9-bd80538086e3	575dc934-b9a9-4989-833b-d7835f870b99	b4bfe835-8b7d-4f8d-ac97-766e23415441	2026-07-02 00:00:54.966
3de0da40-223a-430f-9edf-ed40c08455d4	15aedb14-7b60-4ce8-92f8-80488f2235cc	ab3f63b2-c230-4855-8778-9c67a4385548	2026-07-02 00:01:02.396
0d1bc8d2-d10a-4879-aaea-e8e04f223569	78fea978-782f-4740-9e2f-db0f567a3c32	b4bfe835-8b7d-4f8d-ac97-766e23415441	2026-07-05 22:47:16.955
975faab4-9f99-4409-bb7c-bae251b9e0bd	47c58c02-41d4-4b69-a1b4-577fc6fd1f8c	ab3f63b2-c230-4855-8778-9c67a4385548	2026-07-06 10:04:18.725
3f8be04b-43c1-4fe2-8ec0-4cd4e136d71d	fa65baf1-a48e-43d0-a7e0-91210cf98e1b	ab3f63b2-c230-4855-8778-9c67a4385548	2026-07-06 10:04:18.725
089c9591-d2fc-4c36-8c2b-996b9ae2ca83	7c6c3e00-3355-4216-98f2-08db254ecdb3	ade1688b-1e89-4d87-ac6e-b98482cb0fce	2026-07-13 18:58:42.451
\.


--
-- Data for Name: ClubDocument; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."ClubDocument" ("id", "organizationId", "name", "category", "playerName", "fileUrl", "sizeLabel", "status", "expiresAt", "uploadedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ClubFinanceEntry; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."ClubFinanceEntry" ("id", "organizationId", "label", "amount", "type", "category", "entryDate", "createdAt") FROM stdin;
9f33c400-7aee-4359-aa87-f1e08d1e8eb5	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	salaire 	4500	REVENUE	test	2026-06-25 00:07:51.952	2026-06-25 00:07:51.953
d97cac07-2987-40d9-bbda-085a521d2883	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	sponsor	5000	EXPENSE	Médical	2026-06-25 00:10:56.171	2026-06-25 00:10:56.172
0b743124-fd80-4f5f-8edd-6d3f633d0e6c	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	coatch	40000	EXPENSE	Transfert	2026-06-25 00:13:27.285	2026-06-25 00:13:27.286
\.


--
-- Data for Name: ClubInfrastructure; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."ClubInfrastructure" ("id", "organizationId", "name", "infraType", "status", "capacity", "occupationPct", "nextMaintenance", "createdAt") FROM stdin;
8f4e243a-c813-457d-b8d8-8e4406d98ee4	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	jjj	jjj	jjj	jjj	3	\N	2026-06-24 21:44:37.594
3fb407d8-8db5-4919-88d6-b534bda5fef4	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	traitement	Terrain	Excellent	25000	40	2026-06-28 00:00:00	2026-06-25 01:38:08.458
\.


--
-- Data for Name: ClubInjury; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."ClubInjury" ("id", "organizationId", "playerName", "injuryType", "bodyPart", "returnDate", "riskScore", "createdAt") FROM stdin;
fed96d1a-e106-4954-abc1-b67a20bee76b	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	wahbi kharsri	Inflammation	Bras droit	2026-06-25 00:00:00	5	2026-06-25 00:34:56.138
8460d796-298c-4992-abc0-b7b2e3643e8d	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	wahbi kharsri	Hamstring	head	2026-06-28 00:00:00	6	2026-06-25 00:51:50.917
f596ba1f-39cc-44ac-8d77-e33487f93e54	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbab	cheville	knee-right	2026-06-29 00:00:00	6	2026-06-26 01:48:29.458
769721a0-fa68-4835-bf29-7142944ff7e7	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	wahbi kharsri	tete	tete	2026-06-30 00:00:00	5	2026-06-26 20:45:17.138
1bb77116-0a9c-45b8-8e68-bc1e7d8fd48d	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbab	Contusion	shoulder-left	2026-07-16 00:00:00	5	2026-07-12 11:37:20.635
dd672e7e-92a3-4634-9bb7-ed7d761c9b0a	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	wahbi kharsri	Fracture	ankle-right	2026-07-16 00:00:00	4	2026-07-14 18:44:25.686
\.


--
-- Data for Name: ClubInvoice; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."ClubInvoice" ("id", "organizationId", "reference", "fournisseur", "invoiceType", "montant", "invoiceDate", "dueDate", "status", "description", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ClubMaintenance; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."ClubMaintenance" ("id", "infrastructureId", "taskType", "scheduledDate", "createdAt") FROM stdin;
\.


--
-- Data for Name: ClubMatch; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."ClubMatch" ("id", "organizationId", "opponent", "competition", "matchDate", "homeAway", "goalsFor", "goalsAgainst", "result", "opponentFormation", "opponentStrengths", "opponentWeaknesses", "notes", "createdAt", "updatedAt") FROM stdin;
ba684ea9-871a-43de-bc09-703649ff6a04	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	club africain	Coupe de Tunisie	2026-07-07 00:00:00	E	0	0	N	4-3-3	jeu long	transition	\N	2026-07-05 20:39:19.774	2026-07-05 20:39:19.774
fdd528f6-cbc7-421a-ae9f-e3749781838c	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ES sahel	Match amical	2026-07-04 00:00:00	D	1	2	D	4-4-2	pressing	\N	\N	2026-07-05 20:49:11.694	2026-07-05 20:49:11.694
6c4a0fa9-0b86-4695-a0f2-00330d2278aa	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	club	Ligue des Champions CAF	2026-07-13 00:00:00	E	0	0	N	433	\N	\N	\N	2026-07-12 12:09:03.776	2026-07-12 12:09:03.776
733f83f2-e5c6-4f30-94b3-8a1adc80b0f8	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ESt	Coupe de Tunisie	2026-07-23 00:00:00	E	0	0	N	4-3-3	\N	\N	\N	2026-07-15 16:42:28.277	2026-07-15 16:42:28.277
22bca5c8-92cb-409d-8c52-f9d2b164ac31	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	CSS	Ligue des Champions CAF	2026-07-14 00:00:00	D	3	1	V	4-4-é	jeu long	transitions	\N	2026-07-15 16:48:08.638	2026-07-15 16:48:08.638
\.


--
-- Data for Name: ClubMember; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."ClubMember" ("id", "organizationId", "fullName", "email", "clubRole", "status", "lastLoginAt", "createdAt", "updatedAt", "clubPlayerId") FROM stdin;
7d34def9-c968-4493-81aa-ac6cac17e1bb	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	asmaMed	asmamed@odin.tn	MEDECIN	ACTIF	2026-07-15 14:54:12.744	2026-06-25 22:17:59.634	2026-07-15 14:54:12.745	\N
1d8e5771-163c-4200-8b7d-8222014d317f	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	rocco	roccocoach@gmail.com	COACH	ACTIF	2026-07-15 15:20:04.524	2026-06-24 17:02:51.194	2026-07-15 15:20:04.525	\N
8f6ca4f1-5d8b-4013-b8e4-e187bcd94680	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachanianaly	hachanianaly@odin.tn	ANALYSTE	ACTIF	2026-07-10 15:17:26.091	2026-06-25 19:29:32.009	2026-07-10 15:17:26.092	\N
af2366fa-c264-4ad3-878f-c764a1813a37	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbabscout	ilbabscout@odin.tn	SCOUT	ACTIF	2026-07-17 10:46:23.779	2026-06-27 20:38:04.833	2026-07-17 10:46:23.78	\N
ab3f63b2-c230-4855-8778-9c67a4385548	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachaniResp	hachaniresp@odin.tn	RESPONSABLE	ACTIF	2026-07-17 12:09:56.894	2026-06-25 16:22:49.607	2026-07-17 12:09:56.895	\N
7d89066f-491b-4a96-a169-89ad0495512b	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	res	res@gmail.com	RESPONSABLE	ACTIF	2026-06-27 12:14:45.444	2026-06-24 16:27:44.278	2026-06-27 12:14:45.445	\N
bf31f895-7a41-41f1-8662-dfa458aa7921	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	recuaziz	recuaziz@odin.tn	RECRUTEUR	ACTIF	2026-07-12 17:46:55.931	2026-06-27 22:26:45.082	2026-07-12 17:46:55.932	\N
bb02e87d-60f9-4984-bf13-846c9ee6b6b9	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	azizpreparteurphysique	azizpreparteurphysique@odin.tn	PREPARATEUR	ACTIF	2026-07-06 14:12:56.506	2026-06-25 19:42:34.962	2026-07-06 14:12:56.506	\N
ade1688b-1e89-4d87-ac6e-b98482cb0fce	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbab	ilbab@odin.com	JOUEUR	ACTIF	2026-07-14 13:30:51.78	2026-06-25 01:25:49.585	2026-07-14 13:30:51.784	\N
b4bfe835-8b7d-4f8d-ac97-766e23415441	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	roccofina	roccofina@odin.tn	RESPONSABLE_FINANCIER	ACTIF	2026-07-14 13:31:37.897	2026-06-25 20:55:18.113	2026-07-14 13:31:37.898	\N
\.


--
-- Data for Name: ClubNotification; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."ClubNotification" ("id", "organizationId", "title", "body", "type", "level", "isRead", "createdAt", "sourceKey", "path", "iconKey") FROM stdin;
\.


--
-- Data for Name: ClubPermission; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."ClubPermission" ("id", "organizationId", "module", "clubRole", "canRead", "canCreate", "canUpdate", "canDelete") FROM stdin;
d36924a7-2a2a-4e1e-84c3-4a1077c39d4b	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Joueurs	CLUB_ADMIN	t	t	t	t
42266643-2e79-409d-926b-c087bcb680af	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Joueurs	COACH	t	t	t	f
0dead860-05d1-4a31-b5b3-eab6bbbbf518	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Joueurs	MEDECIN	t	t	t	f
17b4aa4d-f61d-4d03-a9b2-7eafcd70571e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Joueurs	RESPONSABLE_FINANCIER	t	f	f	f
7285dcf4-a7e0-4d89-9731-fc46af1ab25a	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Joueurs	SCOUT	t	t	t	f
29023da4-3998-4cb9-8e6e-2807aaf2ee64	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Joueurs	ANALYSTE	t	f	f	f
6b95e1a2-7dd1-4249-8de8-9763ad31c3d4	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Equipes	CLUB_ADMIN	t	t	t	t
2725b60e-d5f7-4f44-8323-979fabc05c2a	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Equipes	COACH	t	t	t	f
233e6855-e7fc-4eec-bc44-0413db1b3631	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Equipes	MEDECIN	t	f	f	f
757423e2-6176-48ba-8f27-f1d627f6078f	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Equipes	RESPONSABLE_FINANCIER	t	f	f	f
efd25bd2-52ec-46b8-b129-c789a243bc6d	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Equipes	SCOUT	f	f	f	f
c1bb4405-db85-4cc1-898e-b0dc68c2108e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Equipes	ANALYSTE	t	f	f	f
9907ba26-cc99-487e-81d6-fddd46a113c8	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Finances	CLUB_ADMIN	t	t	t	t
52650770-49f1-4a7c-b13e-8a19883679ec	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Finances	COACH	t	f	f	f
61113882-b674-4ba8-b8d2-41817f0a9f28	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Finances	MEDECIN	t	f	f	f
4baed722-7565-4b21-b833-1088a3343a6b	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Finances	RESPONSABLE_FINANCIER	t	t	t	t
03d0d493-6739-4c97-952c-76f89e3bba5b	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Finances	SCOUT	f	f	f	f
438c5644-6466-4f8e-a7ef-f176e115330f	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Finances	ANALYSTE	f	f	f	f
765ba80c-6f02-4937-842d-862417c0c894	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Contrats	CLUB_ADMIN	t	t	t	t
92528a92-6a3d-44c7-9688-70d1ab529793	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Contrats	COACH	t	f	f	f
b794cf9a-3822-4795-a799-93ed2740fade	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Contrats	MEDECIN	t	f	f	f
992931ff-0fca-4ad2-a847-58701321612e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Contrats	RESPONSABLE_FINANCIER	t	t	t	t
66c9797b-5961-4c08-aa49-f217517df2d3	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Contrats	SCOUT	f	f	f	f
a179b8c6-2bbe-4b42-bdb6-39722d764076	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Contrats	ANALYSTE	f	f	f	f
03c701ce-cfcf-4c2c-97a1-2c9204df1898	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Calendrier	CLUB_ADMIN	t	t	t	t
24b1ce6e-0fa3-4562-89d8-09a147a223af	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Calendrier	COACH	t	t	t	f
59ae3786-36b1-4940-9e65-6621b3a7065f	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Calendrier	MEDECIN	t	f	f	f
01ce8d87-3b40-4d8f-85f1-e7a6c0f1ca0f	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Calendrier	RESPONSABLE_FINANCIER	t	f	f	f
0d18370e-2ea6-4bf6-9b17-16d33ec81a40	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Calendrier	SCOUT	f	f	f	f
70817fc8-0408-4e5d-94d9-983b0902154d	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Calendrier	ANALYSTE	f	f	f	f
6a5b10eb-a952-483a-8d73-3ba0231c487d	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Sante	CLUB_ADMIN	t	t	t	t
bb00dc4d-2ee6-4ac0-a1e4-00f90377186e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Sante	COACH	t	f	f	f
b2efa5cd-2f5c-4883-b0e2-3d4f16adf581	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Sante	MEDECIN	t	t	t	f
9b875fc4-b261-4a06-9e66-6061a599b14c	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Sante	RESPONSABLE_FINANCIER	t	f	f	f
06cc617f-ecc5-4614-a131-d0321a58210e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Sante	SCOUT	f	f	f	f
5a30e61e-b05b-4bf8-b565-5e1f72a63cd9	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Sante	ANALYSTE	f	f	f	f
59f55bd3-2e98-466e-bdfd-12e773eca6c6	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Analytics	CLUB_ADMIN	t	t	t	t
960bdb63-9648-412e-ba35-cb1094dcb0e5	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Analytics	COACH	t	t	t	f
1f3a2384-11b5-45bd-9650-f501e0e9063d	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Analytics	MEDECIN	t	f	f	f
b6c059da-33db-451e-a950-a9611faa36e0	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Analytics	RESPONSABLE_FINANCIER	t	f	f	f
569cecd0-38a6-4dc1-b3be-0b46142b79e8	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Analytics	SCOUT	t	t	t	f
e4f0ce0a-b374-4ba7-88fd-a1dbbf42051a	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Analytics	ANALYSTE	t	f	f	f
c7c500d7-c8a4-4ee8-9204-ec3eaee65b7d	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Recrutement	CLUB_ADMIN	t	t	t	t
af030290-8009-4b79-8582-8580f6c4f47c	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Recrutement	COACH	t	f	f	f
6ad277fe-c2da-468a-8967-2c3c8a3a96f6	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Recrutement	MEDECIN	t	f	f	f
183ff357-572c-4878-b193-3cd73b3efb03	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Recrutement	RESPONSABLE_FINANCIER	t	f	f	f
cd2d8ffb-e8bd-4883-8f33-f9e0710ee9ad	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Recrutement	SCOUT	t	t	t	f
c86eb3ff-825a-4168-b894-68a33c1e33e0	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Recrutement	ANALYSTE	f	f	f	f
f4cda7b7-7632-4ef2-b7bd-ee65c6ffe845	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Documents	CLUB_ADMIN	t	t	t	t
5099dba4-3a2a-41d2-aa49-a960b3fe6d73	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Documents	COACH	t	f	f	f
761c8ad7-d049-4616-9189-a2bac3cafc19	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Documents	MEDECIN	t	f	f	f
e180a530-2102-4174-b3f4-2439740083bd	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Documents	RESPONSABLE_FINANCIER	t	f	f	f
52f6f17d-ee59-4dc0-af7c-ce2039d19dc9	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Documents	SCOUT	f	f	f	f
9cb113a9-b59e-4655-b9ee-60d0006383db	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Documents	ANALYSTE	f	f	f	f
fbee986f-3966-40c9-921d-5d03b3262d07	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Parametres	CLUB_ADMIN	t	t	t	t
4055af19-6e3a-4438-aaa6-448fa31b0211	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Parametres	COACH	t	f	f	f
dbb92c17-e353-4749-b995-914ad55014a9	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Parametres	MEDECIN	t	f	f	f
b083e6c9-1e54-4a10-9308-ef10e606ee62	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Parametres	RESPONSABLE_FINANCIER	t	f	f	f
2f96f876-de6d-4ef7-aeeb-339069f99ba4	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Parametres	SCOUT	f	f	f	f
a93a2a8d-b386-40c9-96c1-8ab6e58b063a	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Parametres	ANALYSTE	f	f	f	f
\.


--
-- Data for Name: ClubPlayer; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."ClubPlayer" ("id", "organizationId", "fullName", "position", "age", "ovr", "marketValue", "salaryMonthly", "status", "radar", "createdAt", "updatedAt", "goals", "photoUrl", "stats", "birthDate", "height", "jerseyNumber", "nationality", "strongFoot", "weight") FROM stdin;
6ca23b1c-6d95-4368-8ef5-fe4e18d09c4d	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	wahbi kharsri	MC	18	80	12000	10	BLESSE	\N	2026-06-24 15:16:00.692	2026-07-14 18:44:25.792	4	\N	{"form": 79, "mental": 88, "vitesse": 84, "physique": 71, "technique": 82, "coachRating": 7.7, "seasonStats": {"goals": 4, "assists": 6, "matches": 17}, "trainingLoad": 86, "dashboardHero": {"coachRating": 8.1, "marketValue": "2.3M €", "positionLabel": "premiere ligue", "positionRanking": 6}, "positionRanking": 5, "goalContribution": [{"name": "Buts", "color": "#FF6B57", "value": 24}, {"name": "Assists", "color": "#3B82F6", "value": 33}, {"name": "Chances", "color": "#22C55E", "value": 25}], "marketValueTrend": {"change": "+8%"}, "trainingSessions": {"total": 5, "completed": 4, "intensity": "Élevée", "fatiguePredicted": 51}, "performanceEvolution": [{"month": "Jan", "score": 71}, {"month": "Fév", "score": 73}, {"month": "Mar", "score": 82}, {"month": "Avr", "score": 77}, {"month": "Mai", "score": 84}, {"month": "Juin", "score": 80}]}	\N	\N	0	Tunisie	Droit	\N
7fda0ad8-5224-4c32-ba6e-43267058acc9	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbab	ST	25	99	95000	99	DISPONIBLE	\N	2026-06-24 15:18:04.192	2026-07-14 20:10:01.845	3	\N	{"form": 100, "mental": 91, "vitesse": 98, "physique": 90, "technique": 99, "coachRating": 7, "seasonStats": {"goals": 3, "assists": 4, "matches": 10}, "trainingLoad": 67, "dashboardHero": {"coachRating": 7.8, "marketValue": "1.5M €", "positionLabel": "premiere ligue", "positionRanking": 4}, "positionRanking": 5, "goalContribution": [{"name": "Buts", "color": "#FF6B57", "value": 18}, {"name": "Assists", "color": "#3B82F6", "value": 33}, {"name": "Chances", "color": "#22C55E", "value": 18}], "marketValueTrend": {"change": "+4%"}, "trainingSessions": {"total": 5, "completed": 5, "intensity": "Élevée", "fatiguePredicted": 71}, "performanceEvolution": [{"month": "Jan", "score": 97}, {"month": "Fév", "score": 98}, {"month": "Mar", "score": 99}, {"month": "Avr", "score": 99}, {"month": "Mai", "score": 99}, {"month": "Juin", "score": 99}]}	\N	\N	0	Tunisie	Droit	\N
\.


--
-- Data for Name: ClubSponsor; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."ClubSponsor" ("id", "organizationId", "nom", "logo", "secteur", "montant", "startDate", "endDate", "renewalProbability", "status", "contact", "notes", "createdAt", "updatedAt") FROM stdin;
88809f5c-6dc2-4b3d-b81a-5c0ce7bc1c63	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	tunisie telecom		telecom	12000	2026-07-01 00:00:00	2027-07-01 00:00:00	50	Actif	foot26	\N	2026-07-06 10:18:41.494	2026-07-06 10:18:41.494
\.


--
-- Data for Name: ClubStaff; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."ClubStaff" ("id", "organizationId", "fullName", "role", "salaryMonthly", "contractEnd", "isAvailable", "createdAt", "updatedAt", "phone", "department") FROM stdin;
000706f2-e794-41da-9e99-ed6271b74069	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	test	coach	300	\N	t	2026-06-24 23:56:56.814	2026-06-24 23:56:56.814	\N	\N
9cae2a14-9d38-4670-8da7-9e5b5c984cc9	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	hachani	Scout	600	2026-06-14 00:00:00	t	2026-06-25 00:00:34.189	2026-06-25 00:05:31.75	\N	\N
\.


--
-- Data for Name: ClubStanding; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."ClubStanding" ("id", "organizationId", "competition", "position", "points", "played", "won", "drawn", "lost", "goalsFor", "goalsAgainst", "form", "updatedAt") FROM stdin;
687a4403-3b0c-40f0-8be1-c85bf146844f	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Ligue 1	4	2	1	1	0	0	2	6	V,N,D	2026-07-15 16:48:37.305
\.


--
-- Data for Name: ExpenseRequest; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."ExpenseRequest" ("id", "organizationId", "categoryId", "label", "amount", "requestedBy", "status", "note", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: InjuryRisk; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."InjuryRisk" ("id", "organizationId", "playerId", "zone", "risk", "recommendation", "medicalComment", "medicalAuthor", "createdAt", "updatedAt") FROM stdin;
34c30fae-431d-41fa-918e-847cb9b86d78	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	7fda0ad8-5224-4c32-ba6e-43267058acc9	Hamstring	50	{"Pas de contact"}	repos	DR amira	2026-06-26 03:08:41.76	2026-06-26 03:08:41.76
fc2e446a-ff48-4641-bf34-494fd8c052e1	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	6ca23b1c-6d95-4368-8ef5-fe4e18d09c4d	Général	44	{"stress_7d_mean (négatif (augmente le risque)): +0.68","douleurMusculaire_7d_mean (négatif (augmente le risque)): +0.41","fatigue_7d_mean (négatif (augmente le risque)): +0.35","sommeil (positif (réduit le risque)): -0.27","fatigue (négatif (augmente le risque)): +0.25","totalLoad (positif (réduit le risque)): -0.23","acuteLoad (positif (réduit le risque)): -0.16","stress (négatif (augmente le risque)): +0.09","douleurMusculaire (positif (réduit le risque)): -0.02","ACWR (positif (réduit le risque)): -0.01"}	Niveau de risque IA: Modéré (score: 0.44).	\N	2026-07-02 18:22:19.105	2026-07-02 18:22:19.105
\.


--
-- Data for Name: InvitationCode; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."InvitationCode" ("id", "code", "isActive", "maxUses", "usedCount", "createdAt") FROM stdin;
\.


--
-- Data for Name: MatchReadiness; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."MatchReadiness" ("id", "organizationId", "playerId", "status", "updatedAt") FROM stdin;
c0614cac-5566-449b-9693-c30709547361	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	7fda0ad8-5224-4c32-ba6e-43267058acc9	declined	2026-06-26 03:10:48.16
\.


--
-- Data for Name: Organization; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."Organization" ("id", "clubName", "country", "league", "logoUrl", "invitationCode", "ownerId", "createdAt", "updatedAt", "status", "trialEndsAt") FROM stdin;
05b3d127-76a6-4549-b16c-fe22d05af15d	Test Club	France	Ligue 1	\N	\N	405cc7cd-155c-4158-8722-2bcf9423f96b	2026-06-24 13:20:44.244	2026-07-17 08:09:36.981	SUSPENDED	2026-07-08 13:20:44.244
bb7a0c2c-32f8-4544-9704-e12f13fb84b8	manchester united	Togo	premiere ligue	https://i.ibb.co/ymS8qtWd/141b00110aed.png	\N	eadbc377-e527-4010-b777-4ad080ac74fc	2026-06-24 13:25:47.27	2026-07-17 08:09:37.294	SUSPENDED	2026-07-08 13:25:47.27
\.


--
-- Data for Name: OrganizationProfile; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."OrganizationProfile" ("id", "organizationId", "abbreviation", "officialEmail", "phone", "website", "stadium", "address", "city", "primaryColor", "secondaryColor", "notifyEmail", "notifySms", "notifyPush", "createdAt", "updatedAt") FROM stdin;
720c193b-6de1-4aee-8c36-0c7f1aea616f	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	\N	\N	\N	\N	\N	\N	\N	#FF6B57	#070B1F	t	f	t	2026-06-24 15:21:02.43	2026-06-24 15:21:02.43
\.


--
-- Data for Name: OrganizationSubscription; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."OrganizationSubscription" ("id", "organizationId", "planId", "status", "trialEndsAt", "currentPeriodStart", "currentPeriodEnd", "cancelledAt", "createdAt", "updatedAt") FROM stdin;
f1aee32c-839d-4393-b519-391ee723808b	05b3d127-76a6-4549-b16c-fe22d05af15d	ce4da382-d22d-4eb8-a6c9-c7092f948834	EXPIRED	2026-07-08 13:20:44.244	2026-06-24 13:20:44.244	2026-07-08 13:20:44.244	\N	2026-06-25 03:30:29.003	2026-07-17 08:09:36.981
f5430398-3e2f-4c05-aeb4-0773589e858b	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ce4da382-d22d-4eb8-a6c9-c7092f948834	EXPIRED	2026-07-08 13:25:47.27	2026-06-24 13:25:47.27	2026-07-08 13:25:47.27	\N	2026-06-25 03:30:29.66	2026-07-17 08:09:37.294
\.


--
-- Data for Name: Plan; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."Plan" ("id", "code", "name", "priceMonthly", "currency", "features", "isActive", "sortOrder", "createdAt", "updatedAt") FROM stdin;
ce4da382-d22d-4eb8-a6c9-c7092f948834	STARTER	Starter	590	TND	{"Gestion clubs","Analytics basiques","Support email"}	t	1	2026-06-25 03:30:26.725	2026-07-17 13:27:12.695
65f0edd4-29e8-4f64-b61b-addbb2ddbeb1	PRO	Pro	1290	TND	{"Tableaux avancés",Monitoring,"Support prioritaire"}	t	2	2026-06-25 03:30:27.102	2026-07-17 13:27:12.807
5d823540-02ed-478c-b440-05883d9e930f	ENTERPRISE	Enterprise	2990	TND	{"API avancée","SLA 24/7","Plusieurs organisations"}	t	3	2026-06-25 03:30:27.29	2026-07-17 13:27:12.86
\.


--
-- Data for Name: PlatformBlockedIp; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."PlatformBlockedIp" ("id", "ipAddress", "reason", "country", "createdAt") FROM stdin;
d5b3894a-8385-4b5a-993f-1486b245ed5e	192.168.1.200	Brute force (tentatives multiples)	TN	2026-06-25 03:30:31.967
d1ece7e1-e509-4b33-9ea2-16e1c1f72ed4	45.22.178.91	Scan de ports détecté	RU	2026-06-25 03:30:31.967
\.


--
-- Data for Name: PlatformPayment; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."PlatformPayment" ("id", "organizationId", "invoiceNumber", "amount", "currency", "method", "status", "paidAt", "periodStart", "periodEnd", "notes", "createdAt") FROM stdin;
\.


--
-- Data for Name: PlatformSettings; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."PlatformSettings" ("id", "platformName", "platformUrl", "contactEmail", "supportPhone", "timezone", "defaultLanguage", "currency", "maintenanceMode", "openRegistration", "debugMode", "trialDays", "extendedSettings", "updatedAt") FROM stdin;
default	ODIN ERP	https://odin.erp.tn	admin@odin.erp.tn	+216 71 000 000	Africa/Tunis	fr	TND	f	t	f	14	{"cdnUrl": "", "aiModel": "gpt-4o-mini", "logoUrl": "", "tagline": "Intelligence sportive pour clubs professionnels", "taxRate": 19, "aiApiKey": "", "s3Bucket": "", "s3Region": "eu-west-1", "smtpHost": "smtp.gmail.com", "smtpPort": 587, "smtpUser": "noreply@odin.erp.tn", "aiEnabled": true, "aiProvider": "openai", "faviconUrl": "", "smtpSecure": true, "aiMaxTokens": 4096, "maxUploadMb": 25, "mfaRequired": false, "primaryColor": "#FF7A00", "smtpFromName": "ODIN ERP", "smtpPassword": "", "invoicePrefix": "INV", "smtpFromEmail": "noreply@odin.erp.tn", "stripeEnabled": false, "financeAiUsage": {"bb7a0c2c-32f8-4544-9704-e12f13fb84b8": {"date": "2026-07-02", "reports": 3, "questions": 3}}, "ipBlockEnabled": true, "scoutTeamCache": {"ae": {"teams": [{"id": "ae-al-ain-fc", "city": "Al Ain", "name": "Al Ain FC", "tier": "Pro", "league": "UAE Pro League", "leagueId": "uae-pl", "countryId": "ae", "logoColor": "E30613", "avgPotential": 80, "scoutActivity": "Élevée"}, {"id": "ae-al-jazira-club", "city": "Abou Dabi", "name": "Al Jazira Club", "tier": "Pro", "league": "UAE Pro League", "leagueId": "uae-pl", "countryId": "ae", "logoColor": "E30613", "avgPotential": 79, "scoutActivity": "Élevée"}, {"id": "ain", "city": "Al Ain", "name": "Al-Ain", "tier": "Pro", "league": "UAE Pro League", "leagueId": "uae-pl", "countryId": "ae", "logoColor": "8B5CF6", "avgPotential": 78, "scoutActivity": "Faible"}, {"id": "ae-al-ahli-dubai", "city": "Dubaï", "name": "Al Ahli Dubai", "tier": "Pro", "league": "UAE Pro League", "leagueId": "uae-pl", "countryId": "ae", "logoColor": "E30613", "avgPotential": 78, "scoutActivity": "Moyenne"}, {"id": "ae-sharjah-fc", "city": "Sharjah", "name": "Sharjah FC", "tier": "Pro", "league": "UAE Pro League", "leagueId": "uae-pl", "countryId": "ae", "logoColor": "E30613", "avgPotential": 77, "scoutActivity": "Élevée"}, {"id": "ae-al-nasr", "city": "Dubaï", "name": "Al Nasr", "tier": "Pro", "league": "UAE Pro League", "leagueId": "uae-pl", "countryId": "ae", "logoColor": "E30613", "avgPotential": 76, "scoutActivity": "Moyenne"}, {"id": "ae-al-wasl-fc", "city": "Dubaï", "name": "Al Wasl FC", "tier": "Pro", "league": "UAE Pro League", "leagueId": "uae-pl", "countryId": "ae", "logoColor": "E30613", "avgPotential": 75, "scoutActivity": "Moyenne"}, {"id": "ae-baniyas-sc", "city": "Abou Dabi", "name": "Baniyas SC", "tier": "Pro", "league": "UAE Pro League", "leagueId": "uae-pl", "countryId": "ae", "logoColor": "E30613", "avgPotential": 74, "scoutActivity": "Moyenne"}, {"id": "ae-umm-salal", "city": "Umm Salal", "name": "Umm Salal", "tier": "Pro", "league": "UAE Pro League", "leagueId": "uae-pl", "countryId": "ae", "logoColor": "E30613", "avgPotential": 73, "scoutActivity": "Moyenne"}, {"id": "ae-al-ittihad-kalba", "city": "Kalba", "name": "Al Ittihad Kalba", "tier": "Pro", "league": "UAE Pro League", "leagueId": "uae-pl", "countryId": "ae", "logoColor": "E30613", "avgPotential": 72, "scoutActivity": "Moyenne"}, {"id": "ae-khor-fakkan", "city": "Khor Fakkan", "name": "Khor Fakkan", "tier": "Pro", "league": "UAE Pro League", "leagueId": "uae-pl", "countryId": "ae", "logoColor": "E30613", "avgPotential": 71, "scoutActivity": "Faible"}, {"id": "ae-al-fujairah-sc", "city": "Fujairah", "name": "Al Fujairah SC", "tier": "Pro", "league": "UAE Pro League", "leagueId": "uae-pl", "countryId": "ae", "logoColor": "E30613", "avgPotential": 70, "scoutActivity": "Faible"}, {"id": "ae-al-dhafra", "city": "Madinat Zayed", "name": "Al Dhafra", "tier": "Pro", "league": "UAE Pro League", "leagueId": "uae-pl", "countryId": "ae", "logoColor": "E30613", "avgPotential": 69, "scoutActivity": "Faible"}, {"id": "ae-al-orouba", "city": "Al Orouba", "name": "Al Orouba", "tier": "Pro", "league": "UAE Pro League", "leagueId": "uae-pl", "countryId": "ae", "logoColor": "E30613", "avgPotential": 68, "scoutActivity": "Faible"}], "generatedAt": "2026-07-01T11:31:14.850Z"}, "sa": {"teams": [{"id": "hilal", "city": "Riyad", "name": "Al-Hilal", "tier": "Pro", "league": "Saudi Pro League", "leagueId": "spl", "countryId": "sa", "logoColor": "004A99", "avgPotential": 84, "scoutActivity": "Moyenne"}, {"id": "nassr", "city": "Riyad", "name": "Al-Nassr", "tier": "Pro", "league": "Saudi Pro League", "leagueId": "spl", "countryId": "sa", "logoColor": "FFD700", "avgPotential": 83, "scoutActivity": "Moyenne"}, {"id": "ittihad", "city": "Jeddah", "name": "Al-Ittihad", "tier": "Pro", "league": "Saudi Pro League", "leagueId": "spl", "countryId": "sa", "logoColor": "FFD700", "avgPotential": 82, "scoutActivity": "Moyenne"}, {"id": "sa-al-shabab", "city": "Riyad", "name": "Al-Shabab", "tier": "Pro", "league": "Saudi Pro League", "leagueId": "spl", "countryId": "sa", "logoColor": "E30613", "avgPotential": 80, "scoutActivity": "Moyenne"}, {"id": "sa-al-ahli", "city": "Jeddah", "name": "Al-Ahli", "tier": "Pro", "league": "Saudi Pro League", "leagueId": "spl", "countryId": "sa", "logoColor": "E30613", "avgPotential": 78, "scoutActivity": "Moyenne"}, {"id": "sa-al-taawoun", "city": "Buraidah", "name": "Al-Taawoun", "tier": "Pro", "league": "Saudi Pro League", "leagueId": "spl", "countryId": "sa", "logoColor": "E30613", "avgPotential": 75, "scoutActivity": "Moyenne"}, {"id": "sa-al-ettifaq", "city": "Dammam", "name": "Al-Ettifaq", "tier": "Pro", "league": "Saudi Pro League", "leagueId": "spl", "countryId": "sa", "logoColor": "E30613", "avgPotential": 74, "scoutActivity": "Moyenne"}, {"id": "sa-al-fateh", "city": "Al-Hasa", "name": "Al-Fateh", "tier": "Pro", "league": "Saudi Pro League", "leagueId": "spl", "countryId": "sa", "logoColor": "E30613", "avgPotential": 72, "scoutActivity": "Moyenne"}, {"id": "sa-al-qadsiah", "city": "Khobar", "name": "Al-Qadsiah", "tier": "Pro", "league": "Saudi Pro League", "leagueId": "spl", "countryId": "sa", "logoColor": "E30613", "avgPotential": 71, "scoutActivity": "Moyenne"}, {"id": "sa-al-raed", "city": "Buraidah", "name": "Al-Raed", "tier": "Pro", "league": "Saudi Pro League", "leagueId": "spl", "countryId": "sa", "logoColor": "E30613", "avgPotential": 70, "scoutActivity": "Moyenne"}, {"id": "sa-abha", "city": "Abha", "name": "Abha", "tier": "Pro", "league": "Saudi Pro League", "leagueId": "spl", "countryId": "sa", "logoColor": "E30613", "avgPotential": 69, "scoutActivity": "Moyenne"}, {"id": "sa-al-faisaly", "city": "Al-Majma'ah", "name": "Al-Faisaly", "tier": "Pro", "league": "Saudi Pro League", "leagueId": "spl", "countryId": "sa", "logoColor": "E30613", "avgPotential": 68, "scoutActivity": "Moyenne"}, {"id": "sa-al-batin", "city": "Hafar Al-Batin", "name": "Al-Batin", "tier": "Pro", "league": "Saudi Pro League", "leagueId": "spl", "countryId": "sa", "logoColor": "E30613", "avgPotential": 66, "scoutActivity": "Moyenne"}, {"id": "sa-al-okhdood", "city": "Najran", "name": "Al-Okhdood", "tier": "Pro", "league": "Saudi Pro League", "leagueId": "spl", "countryId": "sa", "logoColor": "E30613", "avgPotential": 65, "scoutActivity": "Moyenne"}, {"id": "sa-al-jabalain", "city": "Hail", "name": "Al-Jabalain", "tier": "Pro", "league": "Saudi Pro League", "leagueId": "spl", "countryId": "sa", "logoColor": "E30613", "avgPotential": 64, "scoutActivity": "Moyenne"}, {"id": "sa-al-ansar", "city": "Madinah", "name": "Al-Ansar", "tier": "Pro", "league": "Saudi Pro League", "leagueId": "spl", "countryId": "sa", "logoColor": "E30613", "avgPotential": 63, "scoutActivity": "Moyenne"}], "generatedAt": "2026-07-01T11:31:13.779Z"}}, "darkModeDefault": true, "gracePeriodDays": 7, "scoutSquadCache": {"ca": {"source": "live", "players": [{"id": "ca-live-0", "age": 36, "flag": "🇹🇳", "name": "Aymen Mathlouthi", "source": "flashscore", "position": "GB", "potential": 65, "inDatabase": false, "marketValue": "1M €", "nationality": "Tunisie", "currentRating": 70}, {"id": "ca-live-1", "age": 23, "flag": "🇹🇳", "name": "Mohamed Ali Ben Romdhane", "source": "flashscore", "position": "MC", "potential": 80, "inDatabase": false, "marketValue": "5M €", "nationality": "Tunisie", "currentRating": 75}, {"id": "ca-live-2", "age": 31, "flag": "🇹🇳", "name": "Youssef Msakni", "source": "flashscore", "position": "BU", "potential": 82, "inDatabase": false, "marketValue": "7M €", "nationality": "Tunisie", "currentRating": 78}, {"id": "ca-live-3", "age": 30, "flag": "🇹🇳", "name": "Hamdi Nagguez", "source": "flashscore", "position": "DD", "potential": 75, "inDatabase": false, "marketValue": "3M €", "nationality": "Tunisie", "currentRating": 73}, {"id": "ca-live-4", "age": 30, "flag": "🇹🇳", "name": "Oussama Haddadi", "source": "flashscore", "position": "DG", "potential": 74, "inDatabase": false, "marketValue": "2M €", "nationality": "Tunisie", "currentRating": 72}, {"id": "ca-live-5", "age": 26, "flag": "🇹🇳", "name": "Aymen Ben Mohamed", "source": "flashscore", "position": "DC", "potential": 77, "inDatabase": false, "marketValue": "4M €", "nationality": "Tunisie", "currentRating": 76}, {"id": "ca-live-6", "age": 28, "flag": "🇹🇳", "name": "Mohamed Ali Yaakoubi", "source": "flashscore", "position": "DC", "potential": 70, "inDatabase": false, "marketValue": "2M €", "nationality": "Tunisie", "currentRating": 71}, {"id": "ca-live-7", "age": 24, "flag": "🇹🇳", "name": "Firas Chaouat", "source": "flashscore", "position": "BU", "potential": 78, "inDatabase": false, "marketValue": "3M €", "nationality": "Tunisie", "currentRating": 74}, {"id": "ca-live-8", "age": 32, "flag": "🇹🇳", "name": "Bilel Ifa", "source": "flashscore", "position": "DC", "potential": 68, "inDatabase": false, "marketValue": "1.5M €", "nationality": "Tunisie", "currentRating": 69}, {"id": "ca-live-9", "age": 29, "flag": "🇹🇳", "name": "Mohamed Dräger", "source": "flashscore", "position": "DD", "potential": 73, "inDatabase": false, "marketValue": "2M €", "nationality": "Tunisie", "currentRating": 72}, {"id": "ca-live-10", "age": 27, "flag": "🇹🇳", "name": "Sofiane Khaoui", "source": "flashscore", "position": "MC", "potential": 76, "inDatabase": false, "marketValue": "3.5M €", "nationality": "Tunisie", "currentRating": 75}, {"id": "ca-live-11", "age": 36, "flag": "🇹🇳", "name": "Khalil Chammam", "source": "flashscore", "position": "DG", "potential": 65, "inDatabase": false, "marketValue": "1M €", "nationality": "Tunisie", "currentRating": 68}, {"id": "ca-live-12", "age": 30, "flag": "🇹🇳", "name": "Mohamed Amine Ben Amor", "source": "flashscore", "position": "MDC", "potential": 72, "inDatabase": false, "marketValue": "2M €", "nationality": "Tunisie", "currentRating": 70}, {"id": "ca-live-13", "age": 29, "flag": "🇹🇳", "name": "Yassine Meriah", "source": "flashscore", "position": "DC", "potential": 74, "inDatabase": false, "marketValue": "3M €", "nationality": "Tunisie", "currentRating": 73}, {"id": "ca-live-14", "age": 29, "flag": "🇹🇳", "name": "Anis Badri", "source": "flashscore", "position": "AG", "potential": 77, "inDatabase": false, "marketValue": "4M €", "nationality": "Tunisie", "currentRating": 75}, {"id": "ca-live-15", "age": 25, "flag": "🇹🇳", "name": "Mohamed Amine Chermiti", "source": "flashscore", "position": "BU", "potential": 79, "inDatabase": false, "marketValue": "3M €", "nationality": "Tunisie", "currentRating": 76}, {"id": "ca-live-16", "age": 22, "flag": "🇹🇳", "name": "Houssem Ben Ali", "source": "flashscore", "position": "MC", "potential": 75, "inDatabase": false, "marketValue": "2M €", "nationality": "Tunisie", "currentRating": 72}, {"id": "ca-live-17", "age": 24, "flag": "🇹🇳", "name": "Walid Hichri", "source": "flashscore", "position": "MOC", "potential": 78, "inDatabase": false, "marketValue": "3M €", "nationality": "Tunisie", "currentRating": 74}], "generatedAt": "2026-07-11T12:28:16.662Z"}, "rm": {"source": "flashscore", "players": [{"id": "rm-fs-0", "age": 33, "flag": "🇪🇸", "name": "Thibaut Courtois", "source": "flashscore", "position": "GB", "potential": 90, "inDatabase": false, "marketValue": "35M €", "nationality": "Belgique", "currentRating": 88}, {"id": "rm-fs-1", "age": 27, "flag": "🇪🇸", "name": "Éder Militão", "source": "flashscore", "position": "DC", "potential": 87, "inDatabase": false, "marketValue": "55M €", "nationality": "Brésil", "currentRating": 85}, {"id": "rm-fs-2", "age": 32, "flag": "🇪🇸", "name": "Antonio Rüdiger", "source": "flashscore", "position": "DC", "potential": 86, "inDatabase": false, "marketValue": "25M €", "nationality": "Allemagne", "currentRating": 84}, {"id": "rm-fs-3", "age": 27, "flag": "🇪🇸", "name": "Federico Valverde", "source": "flashscore", "position": "MC", "potential": 90, "inDatabase": false, "marketValue": "120M €", "nationality": "Uruguay", "currentRating": 88}, {"id": "rm-fs-4", "age": 22, "flag": "🇪🇸", "name": "Jude Bellingham", "source": "flashscore", "position": "MC", "potential": 93, "inDatabase": false, "marketValue": "180M €", "nationality": "Angleterre", "currentRating": 90}, {"id": "rm-fs-5", "age": 25, "flag": "🇪🇸", "name": "Vinícius Jr", "source": "flashscore", "position": "AG", "potential": 93, "inDatabase": false, "marketValue": "150M €", "nationality": "Brésil", "currentRating": 91}, {"id": "rm-fs-6", "age": 24, "flag": "🇪🇸", "name": "Rodrygo", "source": "flashscore", "position": "AD", "potential": 88, "inDatabase": false, "marketValue": "80M €", "nationality": "Brésil", "currentRating": 86}, {"id": "rm-fs-7", "age": 27, "flag": "🇪🇸", "name": "Kylian Mbappé", "source": "flashscore", "position": "BU", "potential": 95, "inDatabase": false, "marketValue": "200M €", "nationality": "France", "currentRating": 93}], "generatedAt": "2026-07-11T11:07:14.769Z"}, "mon": {"players": [{"id": "mon-ai-0", "age": 34, "flag": "🇹🇳", "name": "Aymen Abdennour", "source": "ai", "position": "DC", "potential": 75, "inDatabase": false, "marketValue": "1M €", "nationality": "Tunisie", "currentRating": 70}, {"id": "mon-ai-1", "age": 24, "flag": "🇹🇳", "name": "Mohamed Ali Ben Romdhane", "source": "ai", "position": "MC", "potential": 80, "inDatabase": false, "marketValue": "3M €", "nationality": "Tunisie", "currentRating": 76}, {"id": "mon-ai-2", "age": 27, "flag": "🇹🇳", "name": "Brahim Koné", "source": "ai", "position": "BU", "potential": 78, "inDatabase": false, "marketValue": "2M €", "nationality": "Côte d'Ivoire", "currentRating": 74}, {"id": "mon-ai-3", "age": 30, "flag": "🇹🇳", "name": "Hamdi Nagguez", "source": "ai", "position": "DD", "potential": 76, "inDatabase": false, "marketValue": "1.5M €", "nationality": "Tunisie", "currentRating": 72}, {"id": "mon-ai-4", "age": 25, "flag": "🇹🇳", "name": "Mohamed Ali Ouahbi", "source": "ai", "position": "GB", "potential": 77, "inDatabase": false, "marketValue": "1M €", "nationality": "Tunisie", "currentRating": 73}, {"id": "mon-ai-5", "age": 32, "flag": "🇹🇳", "name": "Youssef Msakni", "source": "ai", "position": "AG", "potential": 79, "inDatabase": false, "marketValue": "2.5M €", "nationality": "Tunisie", "currentRating": 75}, {"id": "mon-ai-6", "age": 28, "flag": "🇹🇳", "name": "Sofiane Khaoui", "source": "ai", "position": "MC", "potential": 77, "inDatabase": false, "marketValue": "1.5M €", "nationality": "Tunisie", "currentRating": 72}, {"id": "mon-ai-7", "age": 23, "flag": "🇹🇳", "name": "Mohamed Zahran", "source": "ai", "position": "DC", "potential": 75, "inDatabase": false, "marketValue": "1M €", "nationality": "Tunisie", "currentRating": 70}, {"id": "mon-ai-8", "age": 31, "flag": "🇹🇳", "name": "Oussama Haddadi", "source": "ai", "position": "DG", "potential": 76, "inDatabase": false, "marketValue": "1M €", "nationality": "Tunisie", "currentRating": 71}, {"id": "mon-ai-9", "age": 26, "flag": "🇹🇳", "name": "Walid Hichri", "source": "ai", "position": "MC", "potential": 78, "inDatabase": false, "marketValue": "2M €", "nationality": "Tunisie", "currentRating": 74}, {"id": "mon-ai-10", "age": 29, "flag": "🇹🇳", "name": "Mouad Ben Romdhane", "source": "ai", "position": "AD", "potential": 77, "inDatabase": false, "marketValue": "1.5M €", "nationality": "Tunisie", "currentRating": 73}, {"id": "mon-ai-11", "age": 25, "flag": "🇹🇳", "name": "Houssem Aouar", "source": "ai", "position": "MC", "potential": 82, "inDatabase": false, "marketValue": "4M €", "nationality": "Tunisie", "currentRating": 78}, {"id": "mon-ai-12", "age": 31, "flag": "🇹🇳", "name": "Mohamed Salah", "source": "ai", "position": "BU", "potential": 80, "inDatabase": false, "marketValue": "3M €", "nationality": "Tunisie", "currentRating": 76}, {"id": "mon-ai-13", "age": 34, "flag": "🇹🇳", "name": "Ali Maaloul", "source": "ai", "position": "DG", "potential": 75, "inDatabase": false, "marketValue": "1M €", "nationality": "Tunisie", "currentRating": 71}, {"id": "mon-ai-14", "age": 36, "flag": "🇹🇳", "name": "Khalil Chammam", "source": "ai", "position": "DC", "potential": 70, "inDatabase": false, "marketValue": "0.5M €", "nationality": "Tunisie", "currentRating": 68}, {"id": "mon-ai-15", "age": 30, "flag": "🇹🇳", "name": "Naim Sliti", "source": "ai", "position": "AG", "potential": 78, "inDatabase": false, "marketValue": "2M €", "nationality": "Tunisie", "currentRating": 74}, {"id": "mon-ai-16", "age": 29, "flag": "🇹🇳", "name": "Sofiane Boufal", "source": "ai", "position": "AD", "potential": 80, "inDatabase": false, "marketValue": "3M €", "nationality": "Tunisie", "currentRating": 76}], "generatedAt": "2026-07-10T14:17:54.617Z"}, "city": {"players": [{"id": "city-ai-0", "age": 30, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Ederson Moraes", "source": "ai", "position": "GB", "potential": 90, "inDatabase": false, "marketValue": "60M €", "nationality": "Brésil", "currentRating": 88}, {"id": "city-ai-1", "age": 26, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Ruben Dias", "source": "ai", "position": "DC", "potential": 90, "inDatabase": false, "marketValue": "70M €", "nationality": "Portugal", "currentRating": 87}, {"id": "city-ai-2", "age": 29, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "João Cancelo", "source": "ai", "position": "DG", "potential": 88, "inDatabase": false, "marketValue": "50M €", "nationality": "Portugal", "currentRating": 86}, {"id": "city-ai-3", "age": 28, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Nathan Aké", "source": "ai", "position": "DC", "potential": 83, "inDatabase": false, "marketValue": "35M €", "nationality": "Pays-Bas", "currentRating": 80}, {"id": "city-ai-4", "age": 33, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Kyle Walker", "source": "ai", "position": "DD", "potential": 82, "inDatabase": false, "marketValue": "20M €", "nationality": "Angleterre", "currentRating": 80}, {"id": "city-ai-5", "age": 27, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Rodri", "source": "ai", "position": "MDC", "potential": 88, "inDatabase": false, "marketValue": "70M €", "nationality": "Espagne", "currentRating": 86}, {"id": "city-ai-6", "age": 32, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Kevin De Bruyne", "source": "ai", "position": "MOC", "potential": 93, "inDatabase": false, "marketValue": "100M €", "nationality": "Belgique", "currentRating": 91}, {"id": "city-ai-7", "age": 29, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Bernardo Silva", "source": "ai", "position": "MC", "potential": 89, "inDatabase": false, "marketValue": "75M €", "nationality": "Portugal", "currentRating": 87}, {"id": "city-ai-8", "age": 23, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Phil Foden", "source": "ai", "position": "AG", "potential": 90, "inDatabase": false, "marketValue": "60M €", "nationality": "Angleterre", "currentRating": 85}, {"id": "city-ai-9", "age": 28, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Jack Grealish", "source": "ai", "position": "AG", "potential": 86, "inDatabase": false, "marketValue": "70M €", "nationality": "Angleterre", "currentRating": 84}, {"id": "city-ai-10", "age": 23, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Erling Haaland", "source": "ai", "position": "BU", "potential": 95, "inDatabase": false, "marketValue": "150M €", "nationality": "Norvège", "currentRating": 92}, {"id": "city-ai-11", "age": 23, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Julian Alvarez", "source": "ai", "position": "BU", "potential": 87, "inDatabase": false, "marketValue": "40M €", "nationality": "Argentine", "currentRating": 81}, {"id": "city-ai-12", "age": 32, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Ilkay Gündogan", "source": "ai", "position": "MC", "potential": 84, "inDatabase": false, "marketValue": "25M €", "nationality": "Allemagne", "currentRating": 82}, {"id": "city-ai-13", "age": 29, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Mateo Kovačić", "source": "ai", "position": "MC", "potential": 85, "inDatabase": false, "marketValue": "30M €", "nationality": "Croatie", "currentRating": 81}, {"id": "city-ai-14", "age": 28, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Kalvin Phillips", "source": "ai", "position": "MDC", "potential": 80, "inDatabase": false, "marketValue": "30M €", "nationality": "Angleterre", "currentRating": 78}, {"id": "city-ai-15", "age": 21, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Josh Wilson-Esbrand", "source": "ai", "position": "DG", "potential": 75, "inDatabase": false, "marketValue": "5M €", "nationality": "Angleterre", "currentRating": 70}, {"id": "city-ai-16", "age": 21, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Cole Palmer", "source": "ai", "position": "AG", "potential": 80, "inDatabase": false, "marketValue": "15M €", "nationality": "Angleterre", "currentRating": 75}], "generatedAt": "2026-06-30T22:56:53.599Z"}, "manu": {"source": "flashscore", "players": [{"id": "manu-fs-0", "age": 29, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "André Onana", "source": "flashscore", "position": "GB", "potential": 82, "inDatabase": false, "marketValue": "18M €", "nationality": "Cameroun", "currentRating": 79}, {"id": "manu-fs-1", "age": 27, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Altay Bayındır", "source": "flashscore", "position": "GB", "potential": 78, "inDatabase": false, "marketValue": "8M €", "nationality": "Turquie", "currentRating": 75}, {"id": "manu-fs-2", "age": 26, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Matthijs de Ligt", "source": "flashscore", "position": "DC", "potential": 86, "inDatabase": false, "marketValue": "42M €", "nationality": "Pays-Bas", "currentRating": 82}, {"id": "manu-fs-3", "age": 27, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Lisandro Martínez", "source": "flashscore", "position": "DC", "potential": 85, "inDatabase": false, "marketValue": "45M €", "nationality": "Argentine", "currentRating": 83}, {"id": "manu-fs-4", "age": 32, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Harry Maguire", "source": "flashscore", "position": "DC", "potential": 78, "inDatabase": false, "marketValue": "15M €", "nationality": "Angleterre", "currentRating": 76}, {"id": "manu-fs-5", "age": 20, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Leny Yoro", "source": "flashscore", "position": "DC", "potential": 88, "inDatabase": false, "marketValue": "55M €", "nationality": "France", "currentRating": 76}, {"id": "manu-fs-6", "age": 28, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Noussair Mazraoui", "source": "flashscore", "position": "DD", "potential": 82, "inDatabase": false, "marketValue": "28M €", "nationality": "Maroc", "currentRating": 80}, {"id": "manu-fs-7", "age": 26, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Diogo Dalot", "source": "flashscore", "position": "DD", "potential": 80, "inDatabase": false, "marketValue": "22M €", "nationality": "Portugal", "currentRating": 78}, {"id": "manu-fs-8", "age": 30, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Luke Shaw", "source": "flashscore", "position": "DG", "potential": 79, "inDatabase": false, "marketValue": "18M €", "nationality": "Angleterre", "currentRating": 77}, {"id": "manu-fs-9", "age": 21, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Patrick Dorgu", "source": "flashscore", "position": "DG", "potential": 84, "inDatabase": false, "marketValue": "22M €", "nationality": "Danemark", "currentRating": 76}, {"id": "manu-fs-10", "age": 33, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Casemiro", "source": "flashscore", "position": "MDC", "potential": 80, "inDatabase": false, "marketValue": "12M €", "nationality": "Brésil", "currentRating": 78}, {"id": "manu-fs-11", "age": 31, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Bruno Fernandes", "source": "flashscore", "position": "MC", "potential": 90, "inDatabase": false, "marketValue": "70M €", "nationality": "Portugal", "currentRating": 87}, {"id": "manu-fs-12", "age": 20, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Kobbie Mainoo", "source": "flashscore", "position": "MC", "potential": 88, "inDatabase": false, "marketValue": "55M €", "nationality": "Angleterre", "currentRating": 82}, {"id": "manu-fs-13", "age": 24, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Manuel Ugarte", "source": "flashscore", "position": "MDC", "potential": 84, "inDatabase": false, "marketValue": "38M €", "nationality": "Uruguay", "currentRating": 80}, {"id": "manu-fs-14", "age": 26, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Mason Mount", "source": "flashscore", "position": "MC", "potential": 81, "inDatabase": false, "marketValue": "25M €", "nationality": "Angleterre", "currentRating": 78}, {"id": "manu-fs-15", "age": 21, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Alejandro Garnacho", "source": "flashscore", "position": "AG", "potential": 87, "inDatabase": false, "marketValue": "45M €", "nationality": "Argentine", "currentRating": 82}, {"id": "manu-fs-16", "age": 28, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Marcus Rashford", "source": "flashscore", "position": "AG", "potential": 85, "inDatabase": false, "marketValue": "40M €", "nationality": "Angleterre", "currentRating": 81}, {"id": "manu-fs-17", "age": 22, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Rasmus Højlund", "source": "flashscore", "position": "BU", "potential": 84, "inDatabase": false, "marketValue": "35M €", "nationality": "Danemark", "currentRating": 79}, {"id": "manu-fs-18", "age": 24, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Joshua Zirkzee", "source": "flashscore", "position": "BU", "potential": 83, "inDatabase": false, "marketValue": "28M €", "nationality": "Pays-Bas", "currentRating": 78}, {"id": "manu-fs-19", "age": 23, "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "name": "Amad Diallo", "source": "flashscore", "position": "AD", "potential": 82, "inDatabase": false, "marketValue": "22M €", "nationality": "Côte d'Ivoire", "currentRating": 78}], "generatedAt": "2026-07-11T11:07:39.912Z"}}, "storageProvider": "local", "stripePublicKey": "", "stripeSecretKey": "", "maxLoginAttempts": 5, "scoutAgentsCache": {"bb7a0c2c-32f8-4544-9704-e12f13fb84b8": {"agents": [{"id": "roc-nation-sports", "flag": "🇧🇷", "name": "Roc Nation Sports", "deals": 1, "email": "contact@rocnationsports.com", "phone": "+216 123456789", "agency": "Roc Nation Sports", "rating": 4.8, "status": "actif", "aiNotes": "Représente Matheus França, potentiel élevé.", "country": "Brésil", "lastContact": "15/10/2023"}, {"id": "pini-zahavi", "flag": "🇮🇱", "name": "Pini Zahavi", "deals": 1, "email": "pini@zahaviagency.com", "phone": "+216 987654321", "agency": "Pini Zahavi Agency", "rating": 4.5, "status": "négociation", "aiNotes": "En analyse pour Soungoutou Magassa.", "country": "Israël", "lastContact": "20/10/2023"}, {"id": "caa-base", "flag": "🇬🇧", "name": "CAA Base", "deals": 1, "email": "info@caabase.com", "phone": "+216 456789123", "agency": "CAA Base", "rating": 4, "status": "négociation", "aiNotes": "Validation en cours pour Liam Delap.", "country": "Royaume-Uni", "lastContact": "22/10/2023"}], "generatedAt": "2026-07-17T11:43:58.866Z"}}, "scoutSavedAgents": {"bb7a0c2c-32f8-4544-9704-e12f13fb84b8": [{"id": "slim-khaled", "flag": "🇹🇬", "name": "Khaled Slim", "deals": 10, "email": "khaled.slim@sportsmanagement.com", "phone": "+228 90 00 00 01", "agency": "Slim Sports Management", "rating": 4.2, "status": "actif", "aiNotes": "Spécialité: joueurs africains émergents", "country": "Togo", "players": [{"id": "sug-khaled-slim-0", "club": "—", "flag": "🇹🇬", "name": "Kossi Agassa", "status": "new", "position": "—", "potential": 0}, {"id": "sug-khaled-slim-1", "club": "—", "flag": "🇹🇬", "name": "Gervinho", "status": "new", "position": "—", "potential": 0}], "lastContact": "15/06/2026"}, {"id": "toure-mamadou", "flag": "🇹🇬", "name": "Mamadou Touré", "deals": 12, "email": "mamadou.toure@mtagency.com", "phone": "+228 91 00 00 02", "agency": "MT Football Agency", "rating": 4.5, "status": "actif", "aiNotes": "Expert en négociation pour jeunes talents", "country": "Togo", "players": [{"id": "sug-mamadou-tour-0", "club": "—", "flag": "🇹🇬", "name": "Emmanuel Adebayor", "status": "new", "position": "—", "potential": 0}, {"id": "sug-mamadou-tour-1", "club": "—", "flag": "🇹🇬", "name": "Serge Gakpé", "status": "new", "position": "—", "potential": 0}], "lastContact": "20/07/2026"}, {"id": "ronaldo-mendes", "flag": "🇵🇹", "name": "Jorge Mendes", "deals": 100, "email": "contact@gestifute.com", "phone": "+351 123 456 789", "agency": "Gestifute", "rating": 5, "status": "actif", "aiNotes": "Spécialité: joueurs de haut niveau, notamment Cristiano Ronaldo.", "country": "Portugal", "players": [{"id": "srch-jorge-mendes-0", "club": "—", "flag": "🇵🇹", "name": "Cristiano Ronaldo", "status": "new", "position": "—", "potential": 0}, {"id": "srch-jorge-mendes-1", "club": "—", "flag": "🇵🇹", "name": "José Mourinho", "status": "new", "position": "—", "potential": 0}], "lastContact": "01/06/2026"}]}, "passwordMinLength": 8, "sessionTimeoutMin": 480, "joueurAiReportCache": {"7fda0ad8-5224-4c32-ba6e-43267058acc9": {"report": {"ovr": 99, "clubName": "manchester united", "position": "ST", "strengths": [{"note": "Excellente précision dans les tirs.", "label": "Shooting", "value": 91}, {"note": "Capacité à dribbler les défenseurs.", "label": "Dribbling", "value": 89}, {"note": "Bonne puissance physique sur le terrain.", "label": "Physical", "value": 85}], "playerName": "ilbab", "weaknesses": [{"note": "Peut améliorer sa vitesse de course.", "label": "Pace", "value": 70}, {"note": "Passes parfois imprécises.", "label": "Passing", "value": 68}, {"note": "Doit travailler sur ses compétences défensives.", "label": "Defending", "value": 65}], "chatHistory": [{"id": "h1", "period": "Aujourd'hui", "question": "Comment se passe ma rééducation?"}], "trainingPlan": [{"day": "Lundi", "icon": "🛌", "focus": "Récupération", "detail": "Séance de récupération active.", "intensity": 50}, {"day": "Mardi", "icon": "🏋️", "focus": "Force", "detail": "Entraînement en salle de musculation.", "intensity": 80}, {"day": "Mercredi", "icon": "⚡", "focus": "Sprint", "detail": "Séance de sprints courts.", "intensity": 85}, {"day": "Jeudi", "icon": "📊", "focus": "Tactique", "detail": "Analyse vidéo et exercices tactiques.", "intensity": 70}, {"day": "Vendredi", "icon": "⚽", "focus": "Finishing", "detail": "Pratique des tirs au but.", "intensity": 90}, {"day": "Samedi", "icon": "😌", "focus": "Repos", "detail": "Journée de repos complet.", "intensity": 0}], "weeklyInsights": {"advice": "Concentre-toi sur la récupération active cette semaine.", "fatigueRisk": "Moyen", "speedChange": "+8%", "enduranceChange": "-3%"}, "recommendations": ["Intègre des exercices de vitesse dans ton entraînement.", "Travaille sur ta précision de passe avec des exercices spécifiques.", "Consulte un physiothérapeute pour ta rééducation."], "injuryPrevention": {"risk": 5, "zone": "Épaule gauche", "level": "Faible", "advice": "Évite les mouvements brusques pour protéger l'épaule."}, "suggestedQuestions": ["Comment puis-je améliorer ma vitesse sur le terrain?", "Quels exercices spécifiques devrais-je faire pour mes passes?", "Comment gérer ma récupération après une blessure?"]}, "generatedAt": "2026-07-13T18:57:37.211Z"}}, "autoSuspendOnFailure": true, "requireStrongPassword": true}	2026-07-17 11:43:58.876
\.


--
-- Data for Name: PlatformSupportTicket; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."PlatformSupportTicket" ("id", "ticketNumber", "organizationId", "clubName", "subject", "description", "priority", "status", "agentName", "createdAt", "updatedAt") FROM stdin;
474dc255-8142-40f1-8e95-1ae569829fd6	SUP-001	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	manchester united	Problème de facturation récurrent	Ticket auto-généré pour manchester united	CRITICAL	OPEN	\N	2026-06-25 03:30:31.019	2026-06-25 03:30:31.019
ea8ab8a6-9301-40d9-abb8-4dd0b5515185	SUP-002	05b3d127-76a6-4549-b16c-fe22d05af15d	Test Club	Demande d'accès API étendue	Ticket auto-généré pour Test Club	HIGH	IN_PROGRESS	Support ODIN	2026-06-25 03:30:31.397	2026-06-25 03:30:31.397
\.


--
-- Data for Name: PlayerAward; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."PlayerAward" ("id", "organizationId", "playerId", "title", "season", "icon", "color", "awardType", "year", "club", "event", "createdAt") FROM stdin;
75326311-5e09-408e-925e-9e3cb5581bd1	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	7fda0ad8-5224-4c32-ba6e-43267058acc9	Joueur du Mois	Mai 2026	🥇	#d99a1f	award	\N	\N	\N	2026-06-25 21:55:16.072
e95f7a68-6a32-4c1b-a722-4b9014418086	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	7fda0ad8-5224-4c32-ba6e-43267058acc9	Meilleur Buteur	Saison 2025-26	⚽	#FF6B57	award	\N	\N	\N	2026-06-25 21:55:16.072
70cc5510-9036-4add-afa3-e20ad4243b6f	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	7fda0ad8-5224-4c32-ba6e-43267058acc9	Fair-Play Award	2024-25	🤝	#22C55E	award	\N	\N	\N	2026-06-25 21:55:16.072
311f03e2-8cd6-4d5d-a7c7-323d14c5ef09	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	7fda0ad8-5224-4c32-ba6e-43267058acc9	Première sélection	2022	⭐	#3B82F6	career	2022	Club Sportif Sfaxien	Première sélection	2026-06-25 21:55:16.072
32d5476b-cbfd-4640-bf54-1983e0e325a6	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	7fda0ad8-5224-4c32-ba6e-43267058acc9	Champion Liga 1	2024-25	🏆	#d99a1f	trophy	2025	manchester united	\N	2026-06-25 21:55:16.072
bfb5e559-c776-4b80-ab42-abd7e0357c49	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	7fda0ad8-5224-4c32-ba6e-43267058acc9	Coupe de Tunisie	2023-24	🥈	#9ca3af	trophy	2024	manchester united	\N	2026-06-25 21:55:16.072
4924126e-1096-4243-bbe0-1a059e3d33df	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	7fda0ad8-5224-4c32-ba6e-43267058acc9	Championnat remporté	2024	🏆	#d99a1f	career	2024	manchester united	Championnat remporté	2026-06-25 21:55:16.072
\.


--
-- Data for Name: PlayerChemistry; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."PlayerChemistry" ("id", "organizationId", "player1Id", "player1Name", "player2Id", "player2Name", "chemistry", "createdAt") FROM stdin;
d10ee75a-ec7a-4fd5-8e64-b47e3c51d684	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	7fda0ad8-5224-4c32-ba6e-43267058acc9	ilbab	6ca23b1c-6d95-4368-8ef5-fe4e18d09c4d	wahbi kharsri	60	2026-06-25 21:55:16.227
\.


--
-- Data for Name: PlayerDocument; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."PlayerDocument" ("id", "organizationId", "playerId", "name", "docType", "docDate", "size", "fileData", "createdAt") FROM stdin;
0c184fc5-5677-4303-93c4-adf0d9851659	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	7fda0ad8-5224-4c32-ba6e-43267058acc9	Contrat_2024.pdf	Contrat	01/01/2024	1.2 MB	\N	2026-06-25 21:55:17.028
a762788e-c76d-41c6-853f-02b66f8f8b66	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	7fda0ad8-5224-4c32-ba6e-43267058acc9	Certificat_Medical.pdf	Médical	25/06/2026	890 KB	\N	2026-06-25 21:55:17.028
2a966bb5-d345-42ca-9c30-30377cc1b172	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	7fda0ad8-5224-4c32-ba6e-43267058acc9	Carte_Identite.pdf	Identité	10/01/2026	2.4 MB	\N	2026-06-25 21:55:17.028
545f5d08-e735-4efb-996e-5becc3e3223c	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	7fda0ad8-5224-4c32-ba6e-43267058acc9	Contrat_2024.pdf	Contrat	01/01/2024	1.2 MB	\N	2026-06-25 21:55:17.028
8e963ecc-3a48-4700-9f6d-93c3a0352ba3	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	7fda0ad8-5224-4c32-ba6e-43267058acc9	Certificat_Medical.pdf	Médical	25/06/2026	890 KB	\N	2026-06-25 21:55:17.028
1f23907f-6206-4f10-b65c-50d298296766	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	7fda0ad8-5224-4c32-ba6e-43267058acc9	Carte_Identite.pdf	Identité	10/01/2026	2.4 MB	\N	2026-06-25 21:55:17.028
cc5548b2-494f-4328-a061-10febd68c1d4	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	6ca23b1c-6d95-4368-8ef5-fe4e18d09c4d	Contrat_2024.pdf	Contrat	01/01/2024	1.2 MB	\N	2026-06-26 01:16:21.658
dfbfab3b-c4fd-4b5c-970a-0b7f4b0a86c8	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	6ca23b1c-6d95-4368-8ef5-fe4e18d09c4d	Certificat_Medical.pdf	Médical	26/06/2026	890 KB	\N	2026-06-26 01:16:21.658
0197e6e8-139d-41f9-9d08-033208e0fd52	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	6ca23b1c-6d95-4368-8ef5-fe4e18d09c4d	Carte_Identite.pdf	Identité	10/01/2026	2.4 MB	\N	2026-06-26 01:16:21.658
39085efd-4d02-4546-bd68-73616f006661	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	7fda0ad8-5224-4c32-ba6e-43267058acc9	Radio	Radio	2026-07-04	—	\N	2026-06-26 01:23:29.074
\.


--
-- Data for Name: PlayerLoad; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."PlayerLoad" ("id", "organizationId", "playerId", "sessionDate", "loadScore", "fatigueScore", "recoveryScore", "sessionType", "notes", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PlayerMatchStat; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."PlayerMatchStat" ("id", "organizationId", "playerId", "matchDate", "opponent", "result", "goals", "assists", "minutes", "rating", "distance", "sprints", "passAccuracy", "topSpeed", "keyPasses", "heatmapData", "createdAt", "redCards", "yellowCards") FROM stdin;
20d81f18-33b6-483d-b259-70dbb67fed46	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	7fda0ad8-5224-4c32-ba6e-43267058acc9	2026-06-11 21:55:16.07	ES Sahel	2-1	0	1	90	7.8	9.4	44	83	34	4	null	2026-06-25 21:55:16.071	0	0
f0400311-fb2a-4e00-9601-97d726c65994	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	7fda0ad8-5224-4c32-ba6e-43267058acc9	2026-05-28 21:55:16.07	CS Sfaxien	1-0	2	1	90	6.8	10.1	32	79	30.1	3	null	2026-06-25 21:55:16.071	0	0
94d2af6a-8e46-4c02-b238-ba445d325b29	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	7fda0ad8-5224-4c32-ba6e-43267058acc9	2026-05-14 21:55:16.07	US Monastir	3-2	0	1	90	8.6	11.8	41	92	31	2	null	2026-06-25 21:55:16.071	0	0
fa81d99f-7a78-4658-b07a-1c65b19788d5	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	7fda0ad8-5224-4c32-ba6e-43267058acc9	2026-04-30 21:55:16.07	CA Bizertin	0-1	1	1	90	7.6	11.5	33	76	33.4	1	null	2026-06-25 21:55:16.071	0	0
d35314b5-f49f-4de7-9cb6-3d09d21f2141	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	7fda0ad8-5224-4c32-ba6e-43267058acc9	2026-04-16 21:55:16.07	Espérance ST	2-0	2	1	90	8.1	10	33	74	34.8	3	null	2026-06-25 21:55:16.071	0	0
59adc67b-02f6-4ba3-87e7-3d52adc62b18	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	6ca23b1c-6d95-4368-8ef5-fe4e18d09c4d	2026-06-21 00:39:15.582	ES Sahel	2-1	0	0	90	8.8	10.2	44	81	33.8	1	null	2026-07-05 00:39:15.583	0	0
8591d99c-6ef7-4295-9d23-de2cfa7b0d9a	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	6ca23b1c-6d95-4368-8ef5-fe4e18d09c4d	2026-06-07 00:39:15.582	CS Sfaxien	1-0	0	0	65	7.7	9.4	22	91	34.7	1	null	2026-07-05 00:39:15.583	0	1
ffb0f2a5-ce2f-4982-9854-cc163dd09d86	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	6ca23b1c-6d95-4368-8ef5-fe4e18d09c4d	2026-05-24 00:39:15.582	US Monastir	3-2	2	1	65	6.7	11.1	42	79	30.1	2	null	2026-07-05 00:39:15.583	0	1
74736819-fc2e-4a5f-91b1-53196b9cdc7b	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	6ca23b1c-6d95-4368-8ef5-fe4e18d09c4d	2026-05-10 00:39:15.582	CA Bizertin	0-1	2	0	65	8.2	9.8	44	75	31.8	2	null	2026-07-05 00:39:15.583	0	1
f6e83d05-d046-4496-a860-99edac2bbeb5	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	6ca23b1c-6d95-4368-8ef5-fe4e18d09c4d	2026-04-26 00:39:15.582	Espérance ST	2-0	0	0	90	7.8	11	32	79	33.7	0	null	2026-07-05 00:39:15.583	0	0
\.


--
-- Data for Name: PlayerTransfer; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."PlayerTransfer" ("id", "organizationId", "playerName", "transferType", "club", "value", "status", "probability", "createdAt") FROM stdin;
4bff1adb-e750-4e92-94c5-b02e4e4e9465	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	wahbi kharsri	Sortant	CS Sfaxien	1.8M €	Négociation	75	2026-06-25 21:55:17.237
9fe547d5-8cfc-4bbb-ad4a-b03b04f4f74e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbab	Sortant	US Monastir	0.8M €	Offre reçue	37	2026-06-25 21:55:17.237
da565d63-77bd-4429-a01d-bf14addbd774	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	wahbi kharsri	Sortant	CS Sfaxien	2.2M €	Négociation	35	2026-06-25 21:55:17.282
6360d6b9-e6ac-4f85-92f3-472222ae4cfc	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbab	Sortant	US Monastir	2.6M €	Offre reçue	77	2026-06-25 21:55:17.282
e45a24bc-f529-45aa-96f7-142fa804b684	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	wahbi kharsri	Sortant	CS Sfaxien	1.0M €	Négociation	80	2026-06-25 21:55:17.34
b684a5c8-3778-456a-a9f8-46d087c8a328	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	ilbab	Sortant	US Monastir	2.6M €	Offre reçue	21	2026-06-25 21:55:17.34
\.


--
-- Data for Name: PrepNotification; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."PrepNotification" ("id", "organizationId", "type", "title", "body", "priority", "isRead", "playerName", "sourceType", "sourceId", "createdAt") FROM stdin;
700d9c58-07d3-4f84-a13d-9fce4fda8e8f	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	blessure	Risque blessure — wahbi kharsri	Zone: Général · Risque: 44% · stress_7d_mean (négatif (augmente le risque)): +0.68	moyenne	f	wahbi kharsri	InjuryRisk	fc2e446a-ff48-4641-bf34-494fd8c052e1	2026-07-04 02:20:31.308
0dc2e7d3-ed3b-4b1f-93a6-acf8ae312e69	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	blessure	Risque blessure — ilbab	Zone: Hamstring · Risque: 50% · Pas de contact	moyenne	f	ilbab	InjuryRisk	34c30fae-431d-41fa-918e-847cb9b86d78	2026-06-26 10:08:49.18
\.


--
-- Data for Name: RecoverySession; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."RecoverySession" ("id", "organizationId", "playerId", "method", "sessionDate", "duration", "status", "notes", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: RecruitmentProspect; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."RecruitmentProspect" ("id", "organizationId", "fullName", "age", "position", "externalClub", "nationality", "potential", "score", "status", "notes", "scoutName", "createdAt", "updatedAt", "scoutExtra") FROM stdin;
4c0a5b3b-5ea6-48ab-959c-f76cfa65147f	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Liam Delap	22	BU	Ipswich Town	Angleterre	84	76	SHORTLISTE	\N	ilbabscout	2025-10-12 10:00:00	2026-07-11 11:21:16.536	{"flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "foot": "Droit", "agent": "CAA Base", "goals": 14, "speed": 82, "height": 186, "league": "Premier League", "mental": 80, "weight": 84, "aiScore": 88, "assists": 4, "defense": 38, "dribble": 78, "matches": 32, "passing": 70, "valueMK": 28000, "legacyId": "mu-pr1", "photoUrl": "https://r2.thesportsdb.com/images/media/player/cutout/dxp7ym1757002801.png", "physical": 88, "priority": "A", "workflow": "validation", "seasonTag": "2026-2027-mu", "injuryRisk": 14, "contractEnd": "2028-06", "marketValue": "28M €", "currentRating": 76}
2073a7af-615f-4528-89ce-72e7cd1ecb9d	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Ayden Heaven	18	DC	Arsenal	Angleterre	88	72	CONTACTE	\N	ilbabscout	2025-09-20 10:00:00	2026-07-11 11:21:16.755	{"flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "foot": "Droit", "goals": 2, "speed": 78, "height": 189, "league": "Premier League", "mental": 83, "weight": 78, "aiScore": 91, "assists": 1, "defense": 86, "dribble": 58, "matches": 18, "passing": 74, "valueMK": 12000, "legacyId": "mu-pr4", "photoUrl": "https://r2.thesportsdb.com/images/media/player/cutout/10d8d61766826718.png", "physical": 84, "priority": "A", "workflow": "signature", "seasonTag": "2026-2027-mu", "injuryRisk": 10, "contractEnd": "2027-06", "marketValue": "12M €", "currentRating": 72}
c8294fc8-9791-4ae0-a5ec-45f3289e8754	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Patrick Dorgu	20	DG	US Lecce	Danemark	82	71	EN_OBSERVATION	\N	ilbabscout	2026-02-08 10:00:00	2026-07-11 11:21:16.811	{"flag": "🇩🇰", "foot": "Gauche", "goals": 3, "speed": 86, "height": 185, "league": "Serie A", "mental": 77, "weight": 76, "aiScore": 84, "assists": 6, "defense": 78, "dribble": 76, "matches": 24, "passing": 74, "valueMK": 15000, "legacyId": "mu-pr5", "photoUrl": "https://r2.thesportsdb.com/images/media/player/cutout/3bm5kb1766826589.png", "physical": 80, "priority": "B", "workflow": "analysis", "seasonTag": "2026-2027-mu", "injuryRisk": 16, "contractEnd": "2028-06", "marketValue": "15M €", "currentRating": 71}
448512bf-2837-478c-83c4-13c9a7aff70d	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Leny Sombory	19	MC	RB Salzburg	Autriche	85	71	SHORTLISTE	\N	ilbabscout	2025-12-01 10:00:00	2026-07-11 11:21:16.965	{"flag": "🇦🇹", "foot": "Droit", "goals": 6, "speed": 80, "height": 178, "league": "Bundesliga AUT", "mental": 84, "weight": 72, "aiScore": 87, "assists": 10, "defense": 68, "dribble": 82, "matches": 27, "passing": 88, "valueMK": 14000, "legacyId": "mu-pr7", "photoUrl": "https://r2.thesportsdb.com/images/media/player/cutout/pn8gp91766827044.png", "physical": 76, "priority": "A", "workflow": "validation", "seasonTag": "2026-2027-mu", "injuryRisk": 12, "contractEnd": "2028-06", "marketValue": "14M €", "currentRating": 71}
646e7a60-b31f-4b88-bcf4-d1f1a3c3a8f4	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Matheus França	21	MOC	Palmeiras	Brésil	88	73	CONTACTE	\N	ilbabscout	2026-04-02 10:00:00	2026-07-11 11:21:17.015	{"flag": "🇧🇷", "foot": "Gauche", "agent": "Roc Nation Sports", "goals": 9, "speed": 85, "height": 175, "league": "Brasileirão", "mental": 82, "weight": 70, "aiScore": 89, "assists": 12, "defense": 48, "dribble": 92, "matches": 30, "passing": 84, "valueMK": 20000, "legacyId": "mu-pr8", "photoUrl": "https://r2.thesportsdb.com/images/media/player/cutout/094jz81767969245.png", "physical": 74, "priority": "A", "workflow": "signature", "seasonTag": "2026-2027-mu", "injuryRisk": 24, "contractEnd": "2027-12", "marketValue": "20M €", "currentRating": 73}
919acde4-88c5-4cba-af4c-ad48838736b3	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Marc Guéhi	25	DC	Crystal Palace	Angleterre	83	78	CONTACTE	\N	ilbabscout	2025-08-10 10:00:00	2026-07-11 11:21:17.077	{"flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "foot": "Droit", "goals": 3, "speed": 76, "height": 182, "league": "Premier League", "mental": 85, "weight": 79, "aiScore": 85, "assists": 2, "defense": 88, "dribble": 62, "matches": 35, "passing": 78, "valueMK": 45000, "legacyId": "mu-pr9", "photoUrl": "https://r2.thesportsdb.com/images/media/player/cutout/842bfy1771748128.png", "physical": 86, "priority": "B", "workflow": "done", "seasonTag": "2026-2027-mu", "injuryRisk": 8, "contractEnd": "2026-06", "marketValue": "45M €", "currentRating": 78}
bc472d12-31cc-4f1c-9961-d94a33c60a81	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Ibrahim Mbaye	19	Ailier G	Paris FC	France	84	70	EN_OBSERVATION	\N	ilbabscout	2026-05-20 10:00:00	2026-07-11 11:21:17.129	{"flag": "🇫🇷", "foot": "Droit", "goals": 10, "speed": 90, "height": 177, "league": "Ligue 2", "mental": 79, "weight": 71, "aiScore": 83, "assists": 5, "defense": 40, "dribble": 86, "matches": 25, "passing": 74, "valueMK": 6000, "legacyId": "mu-pr10", "photoUrl": "https://r2.thesportsdb.com/images/media/player/cutout/aquiiw1766335383.png", "physical": 78, "priority": "B", "workflow": "analysis", "seasonTag": "2026-2027-mu", "injuryRisk": 15, "contractEnd": "2028-06", "marketValue": "6M €", "currentRating": 70}
06ed52fa-614e-46d5-96a8-17595d7bfd59	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	George Evans	23	DC	Brighton	Angleterre	78	72	SHORTLISTE	\N	ilbabscout	2026-06-01 10:00:00	2026-07-11 12:33:29.856	{"flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "foot": "Droit", "goals": 2, "speed": 72, "height": 188, "league": "Premier League", "mental": 78, "weight": 82, "aiScore": 76, "assists": 0, "defense": 82, "dribble": 55, "matches": 22, "passing": 70, "valueMK": 10000, "legacyId": "mu-pr11", "photoUrl": "https://r2.thesportsdb.com/images/media/player/cutout/r26j8k1759591865.png", "physical": 84, "priority": "C", "workflow": "validation", "seasonTag": "2026-2027-mu", "injuryRisk": 18, "contractEnd": "2027-06", "marketValue": "10M €", "currentRating": 72}
b7fe9777-f8c4-43a9-9c72-c8c4d3dcab53	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Soungoutou Magassa	20	MC	AS Monaco	France	87	73	EN_OBSERVATION	\N	ilbabscout	2026-01-18 10:00:00	2026-07-11 11:57:26.029	{"flag": "🇫🇷", "foot": "Droit", "agent": "Pini Zahavi", "goals": 5, "speed": 84, "height": 181, "league": "Ligue 1", "mental": 81, "weight": 75, "aiScore": 86, "assists": 7, "defense": 72, "dribble": 80, "matches": 26, "passing": 82, "valueMK": 18000, "legacyId": "mu-pr3", "photoUrl": "https://r2.thesportsdb.com/images/media/player/cutout/czkp211772133444.png", "physical": 86, "priority": "A", "workflow": "analysis", "seasonTag": "2026-2027-mu", "injuryRisk": 20, "contractEnd": "2028-06", "marketValue": "18M €", "currentRating": 73}
b814f5c6-7974-4d96-bdba-10348e9c4e89	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Carlos Forbs	21	Ailier D	Ajax Amsterdam	Portugal	86	74	EN_OBSERVATION	\N	ilbabscout	2025-11-05 10:00:00	2026-07-11 11:21:16.644	{"flag": "🇵🇹", "foot": "Gauche", "goals": 11, "speed": 91, "height": 169, "league": "Eredivisie", "mental": 78, "weight": 68, "aiScore": 90, "assists": 9, "defense": 42, "dribble": 90, "matches": 29, "passing": 76, "valueMK": 22000, "legacyId": "mu-pr2", "photoUrl": "https://r2.thesportsdb.com/images/media/player/cutout/ildd621767634247.png", "physical": 72, "priority": "A", "workflow": "analysis", "seasonTag": "2026-2027-mu", "injuryRisk": 18, "contractEnd": "2027-06", "marketValue": "22M €", "currentRating": 74}
c71d34b1-54c7-4fae-8880-810308f3b267	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Wilfried Gnonto	21	Ailier D	Leeds United	Angleterre	80	70	NON_TRAITE	\N	ilbabscout	2026-03-15 10:00:00	2026-07-11 11:21:16.911	{"flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "foot": "Gauche", "goals": 8, "speed": 89, "height": 170, "league": "Championship", "mental": 76, "weight": 66, "aiScore": 79, "assists": 7, "defense": 45, "dribble": 84, "matches": 28, "passing": 72, "valueMK": 8000, "legacyId": "mu-pr6", "photoUrl": "https://r2.thesportsdb.com/images/media/player/cutout/dfttgz1757085689.png", "physical": 74, "priority": "B", "workflow": "new", "seasonTag": "2026-2027-mu", "injuryRisk": 22, "contractEnd": "2027-06", "marketValue": "8M €", "currentRating": 70}
fc009fdc-b37c-4fa6-ab43-4fec3f06a7b7	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Kylian Mbappé	27	BU	Real Madrid	France	95	93	NON_TRAITE	\N	ilbabscout	2026-07-11 12:29:25.089	2026-07-11 12:29:25.638	{"flag": "🇫🇷", "foot": "Droit", "goals": 0, "speed": 93, "height": 178, "league": "La Liga", "mental": 91, "weight": 72, "aiScore": 95, "assists": 0, "defense": 85, "dribble": 89, "matches": 0, "passing": 89, "valueMK": 200000, "photoUrl": "https://r2.thesportsdb.com/images/media/player/cutout/h9u9vz1733653583.png", "physical": 89, "priority": "A", "workflow": "new", "injuryRisk": 16, "contractEnd": "2027-06", "marketValue": "200M €", "currentRating": 93}
6cbc9f51-0a9d-44d1-b4ba-9688f8968cf7	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Erling Haaland	25	BU	Manchester City	Norvège	94	92	NON_TRAITE	\N	ilbabscout	2026-07-17 11:41:42.95	2026-07-17 11:41:43.792	{"flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "foot": "Droit", "goals": 0, "speed": 70, "height": 178, "league": "Premier League", "mental": 70, "weight": 72, "aiScore": 94, "assists": 0, "defense": 60, "dribble": 70, "matches": 0, "passing": 70, "valueMK": 180000, "photoUrl": "https://r2.thesportsdb.com/images/media/player/cutout/un3jr11769182465.png", "physical": 70, "priority": "A", "workflow": "new", "injuryRisk": 12, "contractEnd": "2027-06", "marketValue": "180M€", "currentRating": 92}
ca29a252-189c-4f1f-b78f-af4753ce474a	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Josh Cullen	29	MC	Burnley	Irlande	76	74	CONTACTE	\N	ilbabscout	2026-07-01 10:00:00	2026-07-11 12:33:38.505	{"flag": "🇮🇪", "foot": "Droit", "goals": 3, "speed": 68, "height": 175, "league": "Premier League", "mental": 86, "weight": 70, "aiScore": 74, "assists": 6, "defense": 76, "dribble": 72, "matches": 34, "passing": 82, "valueMK": 7000, "legacyId": "mu-pr12", "photoUrl": "https://r2.thesportsdb.com/images/media/player/cutout/54yfn71757174364.png", "physical": 80, "priority": "C", "workflow": "done", "seasonTag": "2026-2027-mu", "injuryRisk": 10, "contractEnd": "2026-06", "marketValue": "7M €", "currentRating": 74}
b74848f1-ed74-404d-92c2-8ce1d844b2a3	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Lamine Yamal	18	Ailier D	Barcelona	Espagne	92	86	SHORTLISTE	\N	ilbabscout	2026-07-11 11:34:45.835	2026-07-17 08:03:11.657	{"flag": "🇪🇸", "foot": "Droit", "goals": 0, "speed": 90, "height": 178, "league": "La Liga", "mental": 88, "weight": 72, "aiScore": 92, "assists": 0, "defense": 82, "dribble": 86, "matches": 0, "passing": 86, "valueMK": 120000, "photoUrl": "https://r2.thesportsdb.com/images/media/player/cutout/m9n4ja1761512633.png", "physical": 86, "priority": "A", "workflow": "new", "injuryRisk": 16, "contractEnd": "2027-06", "marketValue": "120M €", "currentRating": 86}
\.


--
-- Data for Name: RecruteurAuditLog; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."RecruteurAuditLog" ("id", "organizationId", "userName", "userRole", "action", "description", "player", "ipAddress", "severity", "createdAt") FROM stdin;
\.


--
-- Data for Name: RecruteurCalendarEvent; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."RecruteurCalendarEvent" ("id", "organizationId", "title", "eventDate", "eventTime", "type", "location", "note", "createdAt") FROM stdin;
\.


--
-- Data for Name: RecruteurNotification; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."RecruteurNotification" ("id", "organizationId", "type", "title", "body", "priority", "isRead", "player", "createdAt") FROM stdin;
\.


--
-- Data for Name: ScoutReport; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."ScoutReport" ("id", "organizationId", "prospectId", "prospectName", "scoutName", "matchDate", "matchObserved", "opponent", "technique", "physique", "mental", "tactique", "vitesse", "strengths", "weaknesses", "recommendation", "decision", "aiScore", "status", "createdAt", "updatedAt") FROM stdin;
3425d2db-1b01-45fa-9773-77ba5b6db7ca	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	4c0a5b3b-5ea6-48ab-959c-f76cfa65147f	Liam Delap	ilbabscout	\N	Ipswich vs Chelsea	Chelsea	88	86	87	88	88	\N	\N	Profil BU PL prêt. Pressing intense compatible système Amorim.	Recommandé — shortlist immédiate	88	submitted	2026-06-28 14:00:00	2026-07-11 10:17:01.912
fd1f6db4-9b61-4919-b229-b4cd0b880397	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	b814f5c6-7974-4d96-bdba-10348e9c4e89	Carlos Forbs	ilbabscout	\N	Ajax vs Feyenoord	Feyenoord	90	88	89	90	90	\N	\N	Dribble elite. Vérifier constancy défensive sur 90 min.	Validation technique — 2e observation	90	submitted	2026-07-02 11:00:00	2026-07-11 10:17:02.013
6960f691-9b3a-4c6f-b0a2-ba4bd2d46383	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	2073a7af-615f-4528-89ce-72e7cd1ecb9d	Ayden Heaven	ilbabscout	\N	Arsenal U21 vs Chelsea U21	Chelsea U21	91	89	90	91	91	\N	\N	DC jeune homegrown. Négociation directe club favorable.	Signature recommandée	91	submitted	2026-07-05 09:30:00	2026-07-11 10:17:02.065
5360b07d-1f1a-48e5-8782-654a2072e99c	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	646e7a60-b31f-4b88-bcf4-d1f1a3c3a8f4	Matheus França	ilbabscout	\N	Palmeiras vs Flamengo	Flamengo	89	87	88	89	89	\N	\N	Créativité MOC exceptionnelle. Budget 20M validé direction.	Offre à préparer — priorité A	89	submitted	2026-07-08 16:00:00	2026-07-11 10:17:02.116
0cdd502a-edb8-42b3-af17-3652b8b0b5ae	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	448512bf-2837-478c-83c4-13c9a7aff70d	Leny Sombory	ilbabscout	\N	Salzburg vs Sturm Graz	Sturm Graz	87	85	86	87	87	\N	\N	MC box-to-box. Vision et volume de passes top niveau.	Shortlist — compatible 6 PL	87	submitted	2026-06-15 10:00:00	2026-07-11 10:17:02.167
7276fdba-49a7-456e-a8aa-1df0e09c6eac	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	b7fe9777-f8c4-43a9-9c72-c8c4d3dcab53	Soungoutou Magassa	ilbabscout	2026-07-11	\N	\N	63	60	60	55	70	\N	\N	\N	observe	0	submitted	2026-07-11 11:57:25.777	2026-07-11 11:57:25.777
\.


--
-- Data for Name: ScoutWatchlist; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."ScoutWatchlist" ("id", "organizationId", "prospectId", "priority", "notes", "scoutName", "createdAt", "updatedAt") FROM stdin;
cd59db53-1d77-48ad-b281-a2b590706fc2	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	4c0a5b3b-5ea6-48ab-959c-f76cfa65147f	A	[{"date": "08/07", "text": "Priorité #1 BU — budget validé 30M"}]	ilbabscout	2026-07-11 10:17:01.588	2026-07-11 10:17:01.588
60f4c48f-a68a-4e8e-a2ab-5a21648f550e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	b814f5c6-7974-4d96-bdba-10348e9c4e89	A	[{"date": "05/07", "text": "Concurrence Liverpool signalée"}]	ilbabscout	2026-07-11 10:17:01.692	2026-07-11 10:17:01.692
8e5b191c-f4c1-4be0-af30-2c1c4d9622b9	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	2073a7af-615f-4528-89ce-72e7cd1ecb9d	A	[{"date": "01/07", "text": "Signature en cours — medical prévu"}]	ilbabscout	2026-07-11 10:17:01.758	2026-07-11 10:17:01.758
9999b11c-c464-481b-a4d0-90460d629180	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	448512bf-2837-478c-83c4-13c9a7aff70d	A	[{"date": "20/06", "text": "MC alternatif Casemiro"}]	ilbabscout	2026-07-11 10:17:01.809	2026-07-11 10:17:01.809
8a56c727-047d-4bda-b918-be634dd1658a	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	646e7a60-b31f-4b88-bcf4-d1f1a3c3a8f4	A	[{"date": "10/07", "text": "Agent Roc Nation — RDV Londres"}]	ilbabscout	2026-07-11 10:17:01.861	2026-07-11 10:17:01.861
7ba9e755-fad8-4fe4-a9ac-88b784ea7b4e	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	fc009fdc-b37c-4fa6-ab43-4fec3f06a7b7	B	\N	ilbabscout	2026-07-17 10:53:20.158	2026-07-17 10:53:20.158
\.


--
-- Data for Name: SessionPresence; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."SessionPresence" ("id", "organizationId", "playerId", "status", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TrainingProgram; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."TrainingProgram" ("id", "organizationId", "name", "objective", "duration", "intensity", "playerIds", "status", "createdAt") FROM stdin;
4888be7d-1f4a-4da3-89b2-28278d412a58	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	Pré-saison	Base	4 semaines	Moyenne	{7fda0ad8-5224-4c32-ba6e-43267058acc9}	brouillon	2026-06-26 03:10:17.504
\.


--
-- Data for Name: TrainingSession; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."TrainingSession" ("id", "organizationId", "title", "type", "date", "time", "duration", "objective", "exercises", "intensity", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."User" ("id", "email", "createdAt", "acceptPrivacy", "acceptTerms", "fullName", "isActive", "passwordHash", "phone", "role", "updatedAt", "clubMemberRole", "organizationId") FROM stdin;
405cc7cd-155c-4158-8722-2bcf9423f96b	test1782307242@test.com	2026-06-24 13:20:44.171	t	t	Test User	t	$2b$12$6elJiv5sr7xk8Fcg6Ic5qeQ3mKxFCGNuQN1Y8rk/pNiqLnKmrttxS	+33600000000	ADMIN_CLUB	2026-06-24 13:20:44.171	\N	\N
eadbc377-e527-4010-b777-4ad080ac74fc	mohamedsaidhachani93274190@gmail.com	2026-06-24 13:25:47.165	t	t	Mohamed said Hachani	t	$2b$12$BG8ZZP4EwMDDPRATZPFFu.OhjyferffZeiJOPwafoy7nrQWsdAz96	+21693274190	ADMIN_CLUB	2026-06-24 13:25:47.165	\N	\N
0be01273-a805-4681-8042-e7c09e180897	res@gmail.com	2026-06-24 16:54:11.81	t	t	res	t	$2b$12$xEivmNFXjYabP4hBcMLCH.2LaDfZisdMOAXs.6qSqwJu5/xbdHLAG		ADMIN_CLUB	2026-06-24 16:54:11.81	RESPONSABLE	bb7a0c2c-32f8-4544-9704-e12f13fb84b8
3a296b50-9516-4bf6-9def-9109dd50bfd9	roccocoach@gmail.com	2026-06-24 17:02:51.136	t	t	rocco	t	$2b$12$1Y2Dy271D5nJCQ/77/5bTuknnXrz9vlHmtwtvCiDoWcDKZBfStuqG		ADMIN_CLUB	2026-06-24 17:02:51.136	COACH	bb7a0c2c-32f8-4544-9704-e12f13fb84b8
081d21ff-4a44-49b2-a24c-39d8ca419154	ilbab@odin.com	2026-06-25 01:25:49.439	t	t	ilbab	t	$2b$12$.0ADVTnS6E96dJcHVuLnzeFKruYUU5.kYQ3BFLQ3sCS6dVYs4Pxge		ADMIN_CLUB	2026-06-25 01:25:49.439	JOUEUR	bb7a0c2c-32f8-4544-9704-e12f13fb84b8
bfe7b6f0-06b7-486e-8ba1-af8c6e57cd35	superadmin@odin-erp.com	2026-06-25 02:23:45.656	t	t	Super Admin ODIN	t	$2b$12$Jyk8f4ZoSVokLfZkdImMuuXW42H53G8C4CEvLr9X7XrUuZrzglz/u		SUPER_ADMIN	2026-06-25 02:23:45.656	\N	\N
5429b3bf-03ec-488d-9dde-180c8ff1fbca	hachaniresp@odin.tn	2026-06-25 16:22:49.4	t	t	hachaniResp	t	$2b$12$6baxFJrZ3I8akckOOizF1OZgC.JU2Loc5RWFnFh6xbupSSqUnChBK		ADMIN_CLUB	2026-06-25 16:22:49.4	RESPONSABLE	bb7a0c2c-32f8-4544-9704-e12f13fb84b8
6841931f-623b-40e4-b8ce-70cfa99839f9	hachanianaly@odin.tn	2026-06-25 19:29:31.9	t	t	hachanianaly	t	$2b$12$mtvfE5zAEI.yOiZfxdodsuML8UZHTE2pTewUAkqUcw3kUXnE3ivTO		ADMIN_CLUB	2026-06-25 19:29:31.9	ANALYSTE	bb7a0c2c-32f8-4544-9704-e12f13fb84b8
5cceddae-e080-4640-8c41-72365c49b065	azizpreparteurphysique@odin.tn	2026-06-25 19:42:34.86	t	t	azizpreparteurphysique	t	$2b$12$KeJCA3YpPLqEKCOUdB.2EutACj/OKvpvpGRu3660BDdqL/xqYXfpe		ADMIN_CLUB	2026-06-25 19:42:34.86	PREPARATEUR	bb7a0c2c-32f8-4544-9704-e12f13fb84b8
1451c7c1-bd0e-486b-8b82-79c09edb4c57	asmamed@odin.tn	2026-06-25 22:17:59.489	t	t	asmaMed	t	$2b$12$yZ5GExgWgEXs17eR1RfXdu.68Q.zuasmsfB2xD49Zcv6eKDNMcbX.		ADMIN_CLUB	2026-06-25 22:17:59.489	MEDECIN	bb7a0c2c-32f8-4544-9704-e12f13fb84b8
7c942859-981b-4f9c-b28f-252b01fb43be	ilbabscout@odin.tn	2026-06-27 20:38:04.724	t	t	ilbabscout	t	$2b$12$XR2TY5X/2MsWlMgaCh51u.vHy3CdhY2poFskhUAacCicGgWwxXlDW		ADMIN_CLUB	2026-06-27 20:38:04.724	SCOUT	bb7a0c2c-32f8-4544-9704-e12f13fb84b8
780f031a-7d63-4454-b87d-9fbef5dbc520	recuaziz@odin.tn	2026-06-27 22:26:44.972	t	t	recuaziz	t	$2b$12$hO7gNOoeI5a0u.lG7tR5SOrgtG2425ITUALGHJlqCbauBqyW6dTOG		ADMIN_CLUB	2026-06-27 22:26:44.972	RECRUTEUR	bb7a0c2c-32f8-4544-9704-e12f13fb84b8
eb6f370e-8819-4a69-9350-3948d8637f93	roccofina@odin.tn	2026-06-25 20:55:18.005	t	t	roccofina	t	$2b$12$EPcdLygQIfwdwozhYPC.ZuZ0Hug1llQsAc36YrAHBWnB/BDZxrtqW		ADMIN_CLUB	2026-07-02 00:38:58.598	RESPONSABLE_FINANCIER	bb7a0c2c-32f8-4544-9704-e12f13fb84b8
\.


--
-- Data for Name: ValidationRequest; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."ValidationRequest" ("id", "organizationId", "type", "title", "detail", "amount", "priority", "status", "requestedBy", "comment", "sourceKind", "sourceId", "decidedAt", "createdAt", "updatedAt") FROM stdin;
612c361b-dcc3-413c-81fa-112f44cee7e7	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	RECRUTEMENT	Recrutement joueur	Nader Trabelsi — MC · Stade Tunisien	\N	NORMALE	EN_ATTENTE	ilbabscout (Scout)	\N	prospect	e0c54505-1ce4-4e30-ada4-33e2908e90ae	\N	2026-07-01 16:19:35.998	2026-07-01 16:19:35.998
3a3f3cb9-fc75-4aa6-a165-43db95543892	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	RECRUTEMENT	Recrutement joueur	Mouhamed Diallo — Ailier G · AFAD Djékanou	\N	NORMALE	EN_ATTENTE	ilbabscout (Scout)	\N	prospect	528f2b83-e5de-4a91-87c9-00a30bc15492	\N	2026-07-01 16:19:36.152	2026-07-01 16:19:36.152
12f5ffd9-d49e-463f-83ab-14ecda2912a7	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	RECRUTEMENT	Recrutement joueur	Ibrahim Touré — MC · Génération Foot	\N	HAUTE	EN_ATTENTE	ilbabscout (Scout)	\N	prospect	658a9e07-3d1d-4360-afd4-e016aaf35531	\N	2026-07-01 16:19:36.255	2026-07-01 16:19:36.255
9c3ebe84-14f2-4c8c-bf92-c138e475a75d	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	RECRUTEMENT	Recrutement joueur	Achraf Hakimi — DG · Paris SG	\N	HAUTE	EN_ATTENTE	ilbabscout (Scout)	\N	prospect	039bdf7f-5d21-44f8-b443-91fa935397ab	\N	2026-07-07 14:41:12.872	2026-07-07 14:41:12.872
1763fe28-4cf0-4c4f-820f-3bacb308d973	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	RECRUTEMENT	Recrutement joueur	Patrick Dorgu — DG · US Lecce	\N	NORMALE	EN_ATTENTE	ilbabscout (Scout)	\N	prospect	c8294fc8-9791-4ae0-a5ec-45f3289e8754	\N	2026-07-11 14:15:31.53	2026-07-11 14:15:31.53
377afb97-664b-4eb2-b9b1-7460fbab8434	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	RECRUTEMENT	Recrutement joueur	Ibrahim Mbaye — Ailier G · Paris FC	\N	NORMALE	EN_ATTENTE	ilbabscout (Scout)	\N	prospect	bc472d12-31cc-4f1c-9961-d94a33c60a81	\N	2026-07-11 14:15:31.698	2026-07-11 14:15:31.698
f1599e5c-c3ff-4bc6-900a-197b99afe937	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	RECRUTEMENT	Recrutement joueur	Soungoutou Magassa — MC · AS Monaco	\N	HAUTE	EN_ATTENTE	ilbabscout (Scout)	\N	prospect	b7fe9777-f8c4-43a9-9c72-c8c4d3dcab53	\N	2026-07-11 14:15:31.809	2026-07-11 14:15:31.809
6602894c-67de-4ede-abe3-c109237865ac	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	RECRUTEMENT	Recrutement joueur	Carlos Forbs — Ailier D · Ajax Amsterdam	\N	HAUTE	EN_ATTENTE	ilbabscout (Scout)	\N	prospect	b814f5c6-7974-4d96-bdba-10348e9c4e89	\N	2026-07-11 14:15:31.919	2026-07-11 14:15:31.919
af202d47-cfcc-4f6e-ae48-a93e6a64c186	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	RECRUTEMENT	Recrutement joueur	Wilfried Gnonto — Ailier D · Leeds United	\N	NORMALE	EN_ATTENTE	ilbabscout (Scout)	\N	prospect	c71d34b1-54c7-4fae-8880-810308f3b267	\N	2026-07-11 14:15:32.026	2026-07-11 14:15:32.026
aa1993ec-e454-4b6a-81c2-ca81b6db4c3d	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	RECRUTEMENT	Recrutement joueur	Kylian Mbappé — BU · Real Madrid	\N	HAUTE	EN_ATTENTE	ilbabscout (Scout)	\N	prospect	fc009fdc-b37c-4fa6-ab43-4fec3f06a7b7	\N	2026-07-11 14:15:32.134	2026-07-11 14:15:32.134
7e30492e-2938-4676-b139-f14b1ab252cb	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	RECRUTEMENT	Recrutement joueur	Lamine Yamal — Ailier D · Barcelona	\N	HAUTE	VALIDE	ilbabscout (Scout)	\N	prospect	b74848f1-ed74-404d-92c2-8ce1d844b2a3	2026-07-17 08:03:11.519	2026-07-11 14:15:32.276	2026-07-17 08:03:11.52
ff7442ef-9afb-4e8a-a695-7ab3831ec895	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	RECRUTEMENT	Recrutement joueur	Erling Haaland — BU · Manchester City	\N	HAUTE	EN_ATTENTE	ilbabscout (Scout)	\N	prospect	6cbc9f51-0a9d-44d1-b4ba-9688f8968cf7	\N	2026-07-17 12:07:47.563	2026-07-17 12:07:47.563
\.


--
-- Data for Name: WellnessEntry; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."WellnessEntry" ("id", "organizationId", "playerId", "sommeil", "fatigue", "stress", "douleur", "humeur", "filledAt", "updatedAt") FROM stdin;
560cddc7-1cf4-448d-afda-62da3b5b493f	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	7fda0ad8-5224-4c32-ba6e-43267058acc9	7	3	3	2	7	2026-06-26 09:47:44.602	2026-06-26 09:47:44.604
8a05989f-0b79-4360-b614-2465f66db3aa	bb7a0c2c-32f8-4544-9704-e12f13fb84b8	6ca23b1c-6d95-4368-8ef5-fe4e18d09c4d	7	6	6	5	5	2026-06-26 09:47:56.045	2026-06-26 09:47:56.046
\.


--
-- Data for Name: club_player_profiles; Type: TABLE DATA; Schema: public; Owner: erp_admin
--

COPY "public"."club_player_profiles" ("id", "clubPlayerId", "career", "evolution", "heatmapZones", "training", "matchAnalysis", "aiInsight", "fifaAttributes", "chemistry", "messages", "createdAt", "updatedAt") FROM stdin;
a542f084-9bbc-4be2-9763-69ef4242a612	7fda0ad8-5224-4c32-ba6e-43267058acc9	[{"club": "Club actuel", "role": "ST", "period": "2024–"}]	[{"month": "Jan", "score": 91}, {"month": "Mar", "score": 94}, {"month": "Juin", "score": 99}]	[]	{"loadPct": 72, "sessions": []}	{"ratings": [], "avgRating": 9.9}	{"factors": ["Régularité", "Volume de jeu"], "summary": "ilbab progresse régulièrement (OVR 99)."}	{}	[]	\N	2026-07-01 18:59:09.679	2026-07-01 18:59:09.679
\.


--
-- Name: AnalysteModuleData AnalysteModuleData_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."AnalysteModuleData"
    ADD CONSTRAINT "AnalysteModuleData_pkey" PRIMARY KEY ("id");


--
-- Name: BudgetCategory BudgetCategory_organizationId_name_key; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."BudgetCategory"
    ADD CONSTRAINT "BudgetCategory_organizationId_name_key" UNIQUE ("organizationId", "name");


--
-- Name: BudgetCategory BudgetCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."BudgetCategory"
    ADD CONSTRAINT "BudgetCategory_pkey" PRIMARY KEY ("id");


--
-- Name: ClubAuditLog ClubAuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubAuditLog"
    ADD CONSTRAINT "ClubAuditLog_pkey" PRIMARY KEY ("id");


--
-- Name: ClubCalendarEvent ClubCalendarEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubCalendarEvent"
    ADD CONSTRAINT "ClubCalendarEvent_pkey" PRIMARY KEY ("id");


--
-- Name: ClubContract ClubContract_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubContract"
    ADD CONSTRAINT "ClubContract_pkey" PRIMARY KEY ("id");


--
-- Name: ClubDashboardStats ClubDashboardStats_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubDashboardStats"
    ADD CONSTRAINT "ClubDashboardStats_pkey" PRIMARY KEY ("id");


--
-- Name: ClubDirectConversation ClubDirectConversation_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubDirectConversation"
    ADD CONSTRAINT "ClubDirectConversation_pkey" PRIMARY KEY ("id");


--
-- Name: ClubDirectMessageRead ClubDirectMessageRead_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubDirectMessageRead"
    ADD CONSTRAINT "ClubDirectMessageRead_pkey" PRIMARY KEY ("id");


--
-- Name: ClubDirectMessage ClubDirectMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubDirectMessage"
    ADD CONSTRAINT "ClubDirectMessage_pkey" PRIMARY KEY ("id");


--
-- Name: ClubDocument ClubDocument_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubDocument"
    ADD CONSTRAINT "ClubDocument_pkey" PRIMARY KEY ("id");


--
-- Name: ClubFinanceEntry ClubFinanceEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubFinanceEntry"
    ADD CONSTRAINT "ClubFinanceEntry_pkey" PRIMARY KEY ("id");


--
-- Name: ClubInfrastructure ClubInfrastructure_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubInfrastructure"
    ADD CONSTRAINT "ClubInfrastructure_pkey" PRIMARY KEY ("id");


--
-- Name: ClubInjury ClubInjury_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubInjury"
    ADD CONSTRAINT "ClubInjury_pkey" PRIMARY KEY ("id");


--
-- Name: ClubInvoice ClubInvoice_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubInvoice"
    ADD CONSTRAINT "ClubInvoice_pkey" PRIMARY KEY ("id");


--
-- Name: ClubMaintenance ClubMaintenance_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubMaintenance"
    ADD CONSTRAINT "ClubMaintenance_pkey" PRIMARY KEY ("id");


--
-- Name: ClubMatch ClubMatch_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubMatch"
    ADD CONSTRAINT "ClubMatch_pkey" PRIMARY KEY ("id");


--
-- Name: ClubMember ClubMember_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubMember"
    ADD CONSTRAINT "ClubMember_pkey" PRIMARY KEY ("id");


--
-- Name: ClubNotification ClubNotification_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubNotification"
    ADD CONSTRAINT "ClubNotification_pkey" PRIMARY KEY ("id");


--
-- Name: ClubPermission ClubPermission_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubPermission"
    ADD CONSTRAINT "ClubPermission_pkey" PRIMARY KEY ("id");


--
-- Name: ClubPlayer ClubPlayer_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubPlayer"
    ADD CONSTRAINT "ClubPlayer_pkey" PRIMARY KEY ("id");


--
-- Name: ClubSponsor ClubSponsor_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubSponsor"
    ADD CONSTRAINT "ClubSponsor_pkey" PRIMARY KEY ("id");


--
-- Name: ClubStaff ClubStaff_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubStaff"
    ADD CONSTRAINT "ClubStaff_pkey" PRIMARY KEY ("id");


--
-- Name: ClubStanding ClubStanding_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubStanding"
    ADD CONSTRAINT "ClubStanding_pkey" PRIMARY KEY ("id");


--
-- Name: ExpenseRequest ExpenseRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ExpenseRequest"
    ADD CONSTRAINT "ExpenseRequest_pkey" PRIMARY KEY ("id");


--
-- Name: InjuryRisk InjuryRisk_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."InjuryRisk"
    ADD CONSTRAINT "InjuryRisk_pkey" PRIMARY KEY ("id");


--
-- Name: InvitationCode InvitationCode_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."InvitationCode"
    ADD CONSTRAINT "InvitationCode_pkey" PRIMARY KEY ("id");


--
-- Name: MatchReadiness MatchReadiness_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."MatchReadiness"
    ADD CONSTRAINT "MatchReadiness_pkey" PRIMARY KEY ("id");


--
-- Name: OrganizationProfile OrganizationProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."OrganizationProfile"
    ADD CONSTRAINT "OrganizationProfile_pkey" PRIMARY KEY ("id");


--
-- Name: OrganizationSubscription OrganizationSubscription_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."OrganizationSubscription"
    ADD CONSTRAINT "OrganizationSubscription_pkey" PRIMARY KEY ("id");


--
-- Name: Organization Organization_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."Organization"
    ADD CONSTRAINT "Organization_pkey" PRIMARY KEY ("id");


--
-- Name: Plan Plan_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."Plan"
    ADD CONSTRAINT "Plan_pkey" PRIMARY KEY ("id");


--
-- Name: PlatformBlockedIp PlatformBlockedIp_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."PlatformBlockedIp"
    ADD CONSTRAINT "PlatformBlockedIp_pkey" PRIMARY KEY ("id");


--
-- Name: PlatformPayment PlatformPayment_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."PlatformPayment"
    ADD CONSTRAINT "PlatformPayment_pkey" PRIMARY KEY ("id");


--
-- Name: PlatformSettings PlatformSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."PlatformSettings"
    ADD CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id");


--
-- Name: PlatformSupportTicket PlatformSupportTicket_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."PlatformSupportTicket"
    ADD CONSTRAINT "PlatformSupportTicket_pkey" PRIMARY KEY ("id");


--
-- Name: PlayerAward PlayerAward_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."PlayerAward"
    ADD CONSTRAINT "PlayerAward_pkey" PRIMARY KEY ("id");


--
-- Name: PlayerChemistry PlayerChemistry_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."PlayerChemistry"
    ADD CONSTRAINT "PlayerChemistry_pkey" PRIMARY KEY ("id");


--
-- Name: PlayerDocument PlayerDocument_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."PlayerDocument"
    ADD CONSTRAINT "PlayerDocument_pkey" PRIMARY KEY ("id");


--
-- Name: PlayerLoad PlayerLoad_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."PlayerLoad"
    ADD CONSTRAINT "PlayerLoad_pkey" PRIMARY KEY ("id");


--
-- Name: PlayerMatchStat PlayerMatchStat_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."PlayerMatchStat"
    ADD CONSTRAINT "PlayerMatchStat_pkey" PRIMARY KEY ("id");


--
-- Name: PlayerTransfer PlayerTransfer_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."PlayerTransfer"
    ADD CONSTRAINT "PlayerTransfer_pkey" PRIMARY KEY ("id");


--
-- Name: PrepNotification PrepNotification_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."PrepNotification"
    ADD CONSTRAINT "PrepNotification_pkey" PRIMARY KEY ("id");


--
-- Name: RecoverySession RecoverySession_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."RecoverySession"
    ADD CONSTRAINT "RecoverySession_pkey" PRIMARY KEY ("id");


--
-- Name: RecruitmentProspect RecruitmentProspect_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."RecruitmentProspect"
    ADD CONSTRAINT "RecruitmentProspect_pkey" PRIMARY KEY ("id");


--
-- Name: RecruteurAuditLog RecruteurAuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."RecruteurAuditLog"
    ADD CONSTRAINT "RecruteurAuditLog_pkey" PRIMARY KEY ("id");


--
-- Name: RecruteurCalendarEvent RecruteurCalendarEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."RecruteurCalendarEvent"
    ADD CONSTRAINT "RecruteurCalendarEvent_pkey" PRIMARY KEY ("id");


--
-- Name: RecruteurNotification RecruteurNotification_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."RecruteurNotification"
    ADD CONSTRAINT "RecruteurNotification_pkey" PRIMARY KEY ("id");


--
-- Name: ScoutReport ScoutReport_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ScoutReport"
    ADD CONSTRAINT "ScoutReport_pkey" PRIMARY KEY ("id");


--
-- Name: ScoutWatchlist ScoutWatchlist_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ScoutWatchlist"
    ADD CONSTRAINT "ScoutWatchlist_pkey" PRIMARY KEY ("id");


--
-- Name: SessionPresence SessionPresence_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."SessionPresence"
    ADD CONSTRAINT "SessionPresence_pkey" PRIMARY KEY ("id");


--
-- Name: TrainingProgram TrainingProgram_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."TrainingProgram"
    ADD CONSTRAINT "TrainingProgram_pkey" PRIMARY KEY ("id");


--
-- Name: TrainingSession TrainingSession_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."TrainingSession"
    ADD CONSTRAINT "TrainingSession_pkey" PRIMARY KEY ("id");


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");


--
-- Name: ValidationRequest ValidationRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ValidationRequest"
    ADD CONSTRAINT "ValidationRequest_pkey" PRIMARY KEY ("id");


--
-- Name: WellnessEntry WellnessEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."WellnessEntry"
    ADD CONSTRAINT "WellnessEntry_pkey" PRIMARY KEY ("id");


--
-- Name: club_player_profiles club_player_profiles_clubPlayerId_key; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."club_player_profiles"
    ADD CONSTRAINT "club_player_profiles_clubPlayerId_key" UNIQUE ("clubPlayerId");


--
-- Name: club_player_profiles club_player_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."club_player_profiles"
    ADD CONSTRAINT "club_player_profiles_pkey" PRIMARY KEY ("id");


--
-- Name: AnalysteModuleData_organizationId_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "AnalysteModuleData_organizationId_idx" ON "public"."AnalysteModuleData" USING "btree" ("organizationId");


--
-- Name: AnalysteModuleData_organizationId_moduleKey_key; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE UNIQUE INDEX "AnalysteModuleData_organizationId_moduleKey_key" ON "public"."AnalysteModuleData" USING "btree" ("organizationId", "moduleKey");


--
-- Name: ClubDashboardStats_organizationId_key; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE UNIQUE INDEX "ClubDashboardStats_organizationId_key" ON "public"."ClubDashboardStats" USING "btree" ("organizationId");


--
-- Name: ClubDirectConversation_organizationId_lastMessageAt_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "ClubDirectConversation_organizationId_lastMessageAt_idx" ON "public"."ClubDirectConversation" USING "btree" ("organizationId", "lastMessageAt");


--
-- Name: ClubDirectConversation_organizationId_participantAId_partic_key; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE UNIQUE INDEX "ClubDirectConversation_organizationId_participantAId_partic_key" ON "public"."ClubDirectConversation" USING "btree" ("organizationId", "participantAId", "participantBId");


--
-- Name: ClubDirectConversation_organizationId_participantAId_participan; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE UNIQUE INDEX "ClubDirectConversation_organizationId_participantAId_participan" ON "public"."ClubDirectConversation" USING "btree" ("organizationId", "participantAId", "participantBId");


--
-- Name: ClubDirectMessageRead_memberId_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "ClubDirectMessageRead_memberId_idx" ON "public"."ClubDirectMessageRead" USING "btree" ("memberId");


--
-- Name: ClubDirectMessageRead_messageId_memberId_key; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE UNIQUE INDEX "ClubDirectMessageRead_messageId_memberId_key" ON "public"."ClubDirectMessageRead" USING "btree" ("messageId", "memberId");


--
-- Name: ClubDirectMessage_conversationId_createdAt_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "ClubDirectMessage_conversationId_createdAt_idx" ON "public"."ClubDirectMessage" USING "btree" ("conversationId", "createdAt");


--
-- Name: ClubMember_clubPlayerId_key; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE UNIQUE INDEX "ClubMember_clubPlayerId_key" ON "public"."ClubMember" USING "btree" ("clubPlayerId");


--
-- Name: ClubMember_organizationId_email_key; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE UNIQUE INDEX "ClubMember_organizationId_email_key" ON "public"."ClubMember" USING "btree" ("organizationId", "email");


--
-- Name: ClubNotification_organizationId_sourceKey_key; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE UNIQUE INDEX "ClubNotification_organizationId_sourceKey_key" ON "public"."ClubNotification" USING "btree" ("organizationId", "sourceKey") WHERE ("sourceKey" IS NOT NULL);


--
-- Name: ClubPermission_organizationId_module_clubRole_key; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE UNIQUE INDEX "ClubPermission_organizationId_module_clubRole_key" ON "public"."ClubPermission" USING "btree" ("organizationId", "module", "clubRole");


--
-- Name: ClubStanding_organizationId_key; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE UNIQUE INDEX "ClubStanding_organizationId_key" ON "public"."ClubStanding" USING "btree" ("organizationId");


--
-- Name: InjuryRisk_organizationId_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "InjuryRisk_organizationId_idx" ON "public"."InjuryRisk" USING "btree" ("organizationId");


--
-- Name: InjuryRisk_playerId_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "InjuryRisk_playerId_idx" ON "public"."InjuryRisk" USING "btree" ("playerId");


--
-- Name: InvitationCode_code_key; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE UNIQUE INDEX "InvitationCode_code_key" ON "public"."InvitationCode" USING "btree" ("code");


--
-- Name: MatchReadiness_organizationId_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "MatchReadiness_organizationId_idx" ON "public"."MatchReadiness" USING "btree" ("organizationId");


--
-- Name: MatchReadiness_organizationId_playerId_key; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE UNIQUE INDEX "MatchReadiness_organizationId_playerId_key" ON "public"."MatchReadiness" USING "btree" ("organizationId", "playerId");


--
-- Name: OrganizationProfile_organizationId_key; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE UNIQUE INDEX "OrganizationProfile_organizationId_key" ON "public"."OrganizationProfile" USING "btree" ("organizationId");


--
-- Name: OrganizationSubscription_organizationId_key; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE UNIQUE INDEX "OrganizationSubscription_organizationId_key" ON "public"."OrganizationSubscription" USING "btree" ("organizationId");


--
-- Name: Organization_ownerId_key; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE UNIQUE INDEX "Organization_ownerId_key" ON "public"."Organization" USING "btree" ("ownerId");


--
-- Name: Plan_code_key; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE UNIQUE INDEX "Plan_code_key" ON "public"."Plan" USING "btree" ("code");


--
-- Name: PlatformBlockedIp_ipAddress_key; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE UNIQUE INDEX "PlatformBlockedIp_ipAddress_key" ON "public"."PlatformBlockedIp" USING "btree" ("ipAddress");


--
-- Name: PlatformPayment_invoiceNumber_key; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE UNIQUE INDEX "PlatformPayment_invoiceNumber_key" ON "public"."PlatformPayment" USING "btree" ("invoiceNumber");


--
-- Name: PlatformSupportTicket_ticketNumber_key; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE UNIQUE INDEX "PlatformSupportTicket_ticketNumber_key" ON "public"."PlatformSupportTicket" USING "btree" ("ticketNumber");


--
-- Name: PlayerAward_organizationId_playerId_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "PlayerAward_organizationId_playerId_idx" ON "public"."PlayerAward" USING "btree" ("organizationId", "playerId");


--
-- Name: PlayerChemistry_organizationId_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "PlayerChemistry_organizationId_idx" ON "public"."PlayerChemistry" USING "btree" ("organizationId");


--
-- Name: PlayerChemistry_organizationId_player1Id_player2Id_key; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE UNIQUE INDEX "PlayerChemistry_organizationId_player1Id_player2Id_key" ON "public"."PlayerChemistry" USING "btree" ("organizationId", "player1Id", "player2Id");


--
-- Name: PlayerDocument_organizationId_playerId_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "PlayerDocument_organizationId_playerId_idx" ON "public"."PlayerDocument" USING "btree" ("organizationId", "playerId");


--
-- Name: PlayerLoad_organizationId_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "PlayerLoad_organizationId_idx" ON "public"."PlayerLoad" USING "btree" ("organizationId");


--
-- Name: PlayerLoad_playerId_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "PlayerLoad_playerId_idx" ON "public"."PlayerLoad" USING "btree" ("playerId");


--
-- Name: PlayerMatchStat_organizationId_playerId_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "PlayerMatchStat_organizationId_playerId_idx" ON "public"."PlayerMatchStat" USING "btree" ("organizationId", "playerId");


--
-- Name: PlayerTransfer_organizationId_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "PlayerTransfer_organizationId_idx" ON "public"."PlayerTransfer" USING "btree" ("organizationId");


--
-- Name: PrepNotification_organizationId_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "PrepNotification_organizationId_idx" ON "public"."PrepNotification" USING "btree" ("organizationId");


--
-- Name: PrepNotification_organizationId_sourceType_sourceId_key; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE UNIQUE INDEX "PrepNotification_organizationId_sourceType_sourceId_key" ON "public"."PrepNotification" USING "btree" ("organizationId", "sourceType", "sourceId");


--
-- Name: RecoverySession_organizationId_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "RecoverySession_organizationId_idx" ON "public"."RecoverySession" USING "btree" ("organizationId");


--
-- Name: RecruteurAuditLog_organizationId_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "RecruteurAuditLog_organizationId_idx" ON "public"."RecruteurAuditLog" USING "btree" ("organizationId");


--
-- Name: RecruteurCalendarEvent_organizationId_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "RecruteurCalendarEvent_organizationId_idx" ON "public"."RecruteurCalendarEvent" USING "btree" ("organizationId");


--
-- Name: RecruteurNotification_organizationId_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "RecruteurNotification_organizationId_idx" ON "public"."RecruteurNotification" USING "btree" ("organizationId");


--
-- Name: ScoutReport_organizationId_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "ScoutReport_organizationId_idx" ON "public"."ScoutReport" USING "btree" ("organizationId");


--
-- Name: ScoutWatchlist_organizationId_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "ScoutWatchlist_organizationId_idx" ON "public"."ScoutWatchlist" USING "btree" ("organizationId");


--
-- Name: ScoutWatchlist_organizationId_prospectId_key; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE UNIQUE INDEX "ScoutWatchlist_organizationId_prospectId_key" ON "public"."ScoutWatchlist" USING "btree" ("organizationId", "prospectId");


--
-- Name: SessionPresence_organizationId_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "SessionPresence_organizationId_idx" ON "public"."SessionPresence" USING "btree" ("organizationId");


--
-- Name: SessionPresence_organizationId_playerId_key; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE UNIQUE INDEX "SessionPresence_organizationId_playerId_key" ON "public"."SessionPresence" USING "btree" ("organizationId", "playerId");


--
-- Name: SessionPresence_playerId_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "SessionPresence_playerId_idx" ON "public"."SessionPresence" USING "btree" ("playerId");


--
-- Name: TrainingProgram_organizationId_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "TrainingProgram_organizationId_idx" ON "public"."TrainingProgram" USING "btree" ("organizationId");


--
-- Name: TrainingSession_organizationId_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "TrainingSession_organizationId_idx" ON "public"."TrainingSession" USING "btree" ("organizationId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE UNIQUE INDEX "User_email_key" ON "public"."User" USING "btree" ("email");


--
-- Name: WellnessEntry_organizationId_idx; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE INDEX "WellnessEntry_organizationId_idx" ON "public"."WellnessEntry" USING "btree" ("organizationId");


--
-- Name: WellnessEntry_organizationId_playerId_key; Type: INDEX; Schema: public; Owner: erp_admin
--

CREATE UNIQUE INDEX "WellnessEntry_organizationId_playerId_key" ON "public"."WellnessEntry" USING "btree" ("organizationId", "playerId");


--
-- Name: AnalysteModuleData AnalysteModuleData_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."AnalysteModuleData"
    ADD CONSTRAINT "AnalysteModuleData_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BudgetCategory BudgetCategory_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."BudgetCategory"
    ADD CONSTRAINT "BudgetCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClubAuditLog ClubAuditLog_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubAuditLog"
    ADD CONSTRAINT "ClubAuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClubCalendarEvent ClubCalendarEvent_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubCalendarEvent"
    ADD CONSTRAINT "ClubCalendarEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClubContract ClubContract_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubContract"
    ADD CONSTRAINT "ClubContract_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClubDashboardStats ClubDashboardStats_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubDashboardStats"
    ADD CONSTRAINT "ClubDashboardStats_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClubDirectConversation ClubDirectConversation_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubDirectConversation"
    ADD CONSTRAINT "ClubDirectConversation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClubDirectMessageRead ClubDirectMessageRead_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubDirectMessageRead"
    ADD CONSTRAINT "ClubDirectMessageRead_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."ClubDirectMessage"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClubDirectMessage ClubDirectMessage_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubDirectMessage"
    ADD CONSTRAINT "ClubDirectMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."ClubDirectConversation"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClubDocument ClubDocument_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubDocument"
    ADD CONSTRAINT "ClubDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClubFinanceEntry ClubFinanceEntry_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubFinanceEntry"
    ADD CONSTRAINT "ClubFinanceEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClubInfrastructure ClubInfrastructure_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubInfrastructure"
    ADD CONSTRAINT "ClubInfrastructure_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClubInjury ClubInjury_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubInjury"
    ADD CONSTRAINT "ClubInjury_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClubInvoice ClubInvoice_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubInvoice"
    ADD CONSTRAINT "ClubInvoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClubMaintenance ClubMaintenance_infrastructureId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubMaintenance"
    ADD CONSTRAINT "ClubMaintenance_infrastructureId_fkey" FOREIGN KEY ("infrastructureId") REFERENCES "public"."ClubInfrastructure"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClubMember ClubMember_clubPlayerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubMember"
    ADD CONSTRAINT "ClubMember_clubPlayerId_fkey" FOREIGN KEY ("clubPlayerId") REFERENCES "public"."ClubPlayer"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ClubMember ClubMember_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubMember"
    ADD CONSTRAINT "ClubMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClubNotification ClubNotification_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubNotification"
    ADD CONSTRAINT "ClubNotification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClubPermission ClubPermission_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubPermission"
    ADD CONSTRAINT "ClubPermission_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClubPlayer ClubPlayer_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubPlayer"
    ADD CONSTRAINT "ClubPlayer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClubSponsor ClubSponsor_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubSponsor"
    ADD CONSTRAINT "ClubSponsor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClubStaff ClubStaff_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ClubStaff"
    ADD CONSTRAINT "ClubStaff_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ExpenseRequest ExpenseRequest_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ExpenseRequest"
    ADD CONSTRAINT "ExpenseRequest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."BudgetCategory"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ExpenseRequest ExpenseRequest_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ExpenseRequest"
    ADD CONSTRAINT "ExpenseRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InjuryRisk InjuryRisk_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."InjuryRisk"
    ADD CONSTRAINT "InjuryRisk_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InjuryRisk InjuryRisk_playerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."InjuryRisk"
    ADD CONSTRAINT "InjuryRisk_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."ClubPlayer"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MatchReadiness MatchReadiness_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."MatchReadiness"
    ADD CONSTRAINT "MatchReadiness_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MatchReadiness MatchReadiness_playerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."MatchReadiness"
    ADD CONSTRAINT "MatchReadiness_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."ClubPlayer"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrganizationProfile OrganizationProfile_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."OrganizationProfile"
    ADD CONSTRAINT "OrganizationProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrganizationSubscription OrganizationSubscription_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."OrganizationSubscription"
    ADD CONSTRAINT "OrganizationSubscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrganizationSubscription OrganizationSubscription_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."OrganizationSubscription"
    ADD CONSTRAINT "OrganizationSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."Plan"("id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Organization Organization_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."Organization"
    ADD CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PlatformPayment PlatformPayment_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."PlatformPayment"
    ADD CONSTRAINT "PlatformPayment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PlatformSupportTicket PlatformSupportTicket_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."PlatformSupportTicket"
    ADD CONSTRAINT "PlatformSupportTicket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PlayerAward PlayerAward_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."PlayerAward"
    ADD CONSTRAINT "PlayerAward_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PlayerAward PlayerAward_playerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."PlayerAward"
    ADD CONSTRAINT "PlayerAward_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."ClubPlayer"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PlayerChemistry PlayerChemistry_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."PlayerChemistry"
    ADD CONSTRAINT "PlayerChemistry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PlayerDocument PlayerDocument_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."PlayerDocument"
    ADD CONSTRAINT "PlayerDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PlayerDocument PlayerDocument_playerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."PlayerDocument"
    ADD CONSTRAINT "PlayerDocument_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."ClubPlayer"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PlayerLoad PlayerLoad_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."PlayerLoad"
    ADD CONSTRAINT "PlayerLoad_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PlayerLoad PlayerLoad_playerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."PlayerLoad"
    ADD CONSTRAINT "PlayerLoad_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."ClubPlayer"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PlayerMatchStat PlayerMatchStat_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."PlayerMatchStat"
    ADD CONSTRAINT "PlayerMatchStat_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PlayerMatchStat PlayerMatchStat_playerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."PlayerMatchStat"
    ADD CONSTRAINT "PlayerMatchStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."ClubPlayer"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PlayerTransfer PlayerTransfer_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."PlayerTransfer"
    ADD CONSTRAINT "PlayerTransfer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PrepNotification PrepNotification_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."PrepNotification"
    ADD CONSTRAINT "PrepNotification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RecoverySession RecoverySession_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."RecoverySession"
    ADD CONSTRAINT "RecoverySession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RecoverySession RecoverySession_playerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."RecoverySession"
    ADD CONSTRAINT "RecoverySession_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."ClubPlayer"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RecruitmentProspect RecruitmentProspect_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."RecruitmentProspect"
    ADD CONSTRAINT "RecruitmentProspect_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ScoutReport ScoutReport_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ScoutReport"
    ADD CONSTRAINT "ScoutReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ScoutWatchlist ScoutWatchlist_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ScoutWatchlist"
    ADD CONSTRAINT "ScoutWatchlist_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SessionPresence SessionPresence_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."SessionPresence"
    ADD CONSTRAINT "SessionPresence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SessionPresence SessionPresence_playerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."SessionPresence"
    ADD CONSTRAINT "SessionPresence_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."ClubPlayer"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TrainingProgram TrainingProgram_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."TrainingProgram"
    ADD CONSTRAINT "TrainingProgram_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TrainingSession TrainingSession_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."TrainingSession"
    ADD CONSTRAINT "TrainingSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."User"
    ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ValidationRequest ValidationRequest_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."ValidationRequest"
    ADD CONSTRAINT "ValidationRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WellnessEntry WellnessEntry_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."WellnessEntry"
    ADD CONSTRAINT "WellnessEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WellnessEntry WellnessEntry_playerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."WellnessEntry"
    ADD CONSTRAINT "WellnessEntry_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."ClubPlayer"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: club_player_profiles club_player_profiles_clubPlayerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_admin
--

ALTER TABLE ONLY "public"."club_player_profiles"
    ADD CONSTRAINT "club_player_profiles_clubPlayerId_fkey" FOREIGN KEY ("clubPlayerId") REFERENCES "public"."ClubPlayer"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict t1XVALM72cZPHoQEwH0kbwwV5l54JcJo11zQqRgCL6EkRS40iHfTaJgzX25kCso

