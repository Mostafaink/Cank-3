import { supabase } from './supabase';

export interface OfferTemplate {
  id: string;
  name: string;
  type: 'cash' | 'receivables';
  amount: number;
  config: {
    combinations?: Array<{
      label: string;
      counts: Record<string, number>;
    }>;
    schedules?: string[];
    enabled_count?: number;
    schedule_enabled_count?: number;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  user_id: string;
  type: string;
  status: 'available' | 'accepted';
  amount: number;
  config: {
    combinations?: Array<{
      label: string;
      counts: Record<string, number>;
    }>;
    schedules?: string[];
    enabled_count?: number;
    schedule_enabled_count?: number;
  };
  created_at: string;
  accepted_at: string | null;
  template_id?: string | null;
  is_template_instance?: boolean;
}

export interface OfferAssignment {
  id: string;
  template_id: string | null;
  offer_id: string;
  user_id: string;
  status: 'assigned' | 'accepted' | 'expired' | 'cancelled';
  assigned_at: string;
  accepted_at: string | null;
  metadata: Record<string, any>;
}

export async function getOffers(userId: string, type?: string): Promise<Offer[]> {
  let query = supabase
    .from('offers')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'available')
    .order('created_at', { ascending: true });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching offers:', error);
    return [];
  }

  return data as Offer[];
}

export async function acceptOffer(offerId: string): Promise<boolean> {
  const { error } = await supabase
    .from('offers')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString()
    })
    .eq('id', offerId);

  if (error) {
    console.error('Error accepting offer:', error);
    return false;
  }

  return true;
}

export async function updateOfferAmount(offerId: string, amount: number): Promise<boolean> {
  const { error } = await supabase
    .from('offers')
    .update({ amount })
    .eq('id', offerId);

  if (error) {
    console.error('Error updating offer amount:', error);
    return false;
  }

  return true;
}

export async function updateOfferConfig(offerId: string, config: any): Promise<boolean> {
  const { error } = await supabase
    .from('offers')
    .update({ config })
    .eq('id', offerId);

  if (error) {
    console.error('Error updating offer config:', error);
    return false;
  }

  return true;
}

export async function getOfferTemplates(type?: 'cash' | 'receivables'): Promise<OfferTemplate[]> {
  let query = supabase
    .from('offer_templates')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching offer templates:', error);
    return [];
  }

  return data as OfferTemplate[];
}

export async function getAllOfferTemplates(): Promise<OfferTemplate[]> {
  const { data, error } = await supabase
    .from('offer_templates')
    .select('*')
    .order('type', { ascending: true })
    .order('amount', { ascending: true });

  if (error) {
    console.error('Error fetching all offer templates:', error);
    return [];
  }

  return data as OfferTemplate[];
}

export async function createOfferTemplate(
  name: string,
  type: 'cash' | 'receivables',
  amount: number,
  config: any
): Promise<OfferTemplate | null> {
  const { data, error } = await supabase
    .from('offer_templates')
    .insert({
      name,
      type,
      amount,
      config
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating offer template:', error);
    return null;
  }

  return data as OfferTemplate;
}

export async function updateOfferTemplate(
  templateId: string,
  updates: Partial<Omit<OfferTemplate, 'id' | 'created_at'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('offer_templates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', templateId);

  if (error) {
    console.error('Error updating offer template:', error);
    return false;
  }

  return true;
}

export async function deleteOfferTemplate(templateId: string): Promise<boolean> {
  const { error } = await supabase
    .from('offer_templates')
    .update({ is_active: false })
    .eq('id', templateId);

  if (error) {
    console.error('Error deleting offer template:', error);
    return false;
  }

  return true;
}

export async function assignTemplateToUser(
  templateId: string,
  userId: string
): Promise<Offer | null> {
  const { data: template, error: templateError } = await supabase
    .from('offer_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (templateError || !template) {
    console.error('Error fetching template:', templateError);
    return null;
  }

  const { data: offer, error: offerError } = await supabase
    .from('offers')
    .insert({
      user_id: userId,
      type: template.type,
      status: 'available',
      amount: template.amount,
      config: template.config,
      template_id: templateId,
      is_template_instance: true
    })
    .select()
    .single();

  if (offerError || !offer) {
    console.error('Error creating offer from template:', offerError);
    return null;
  }

  const { error: assignmentError } = await supabase
    .from('offer_assignments')
    .insert({
      template_id: templateId,
      offer_id: offer.id,
      user_id: userId,
      status: 'assigned'
    });

  if (assignmentError) {
    console.error('Error creating offer assignment:', assignmentError);
  }

  return offer as Offer;
}

export async function resetOfferToAvailable(offerId: string): Promise<boolean> {
  const { error } = await supabase
    .from('offers')
    .update({
      status: 'available',
      accepted_at: null
    })
    .eq('id', offerId);

  if (error) {
    console.error('Error resetting offer:', error);
    return false;
  }

  const { error: assignmentError } = await supabase
    .from('offer_assignments')
    .update({ status: 'assigned', accepted_at: null })
    .eq('offer_id', offerId)
    .eq('status', 'accepted');

  if (assignmentError) {
    console.error('Error updating assignment status:', assignmentError);
  }

  return true;
}

export async function getOfferAssignments(userId?: string): Promise<OfferAssignment[]> {
  let query = supabase
    .from('offer_assignments')
    .select('*')
    .order('assigned_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching offer assignments:', error);
    return [];
  }

  return data as OfferAssignment[];
}

// Protected server-side price calculation
// Frontend cannot access actual prices; all calculations are validated server-side
export async function calculateCardPrice(
  color: string,
  quantity: number
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('calculate_card_price', {
      card_color: color,
      card_quantity: quantity
    });

    if (error) {
      console.error('Error calculating card price:', error);
      // Fallback to 0 if backend function doesn't exist yet
      return 0;
    }

    return data as number;
  } catch (e) {
    console.error('Exception calling calculate_card_price:', e);
    return 0;
  }
}
