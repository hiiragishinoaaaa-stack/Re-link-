-- Run this in your Supabase SQL editor
-- Migration 001: add landing page fields to the links table

alter table public.links
  add column if not exists landing_title       text,
  add column if not exists landing_description text,
  add column if not exists landing_image       text,
  add column if not exists button_text         text;
