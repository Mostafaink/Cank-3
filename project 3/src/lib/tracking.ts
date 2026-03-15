import { supabase } from './supabase';

export async function trackConversion(
  userId: string,
  action: string,
  metadata?: Record<string, any>
) {
  try {
    const { error } = await supabase
      .from('conversions')
      .insert({
        user_id: userId,
        action,
        metadata: metadata || {}
      });

    if (error) {
      console.error('Error tracking conversion:', error);
    }
  } catch (err) {
    console.error('Error tracking conversion:', err);
  }
}

export async function trackModalClick(
  userId: string,
  modalName: string,
  clickAction: 'accept' | 'recheck',
  modalStep?: number,
  metadata?: Record<string, any>
) {
  try {
    const { error } = await supabase
      .from('conversions')
      .insert({
        user_id: userId,
        action: `${modalName}_${clickAction}`,
        metadata: {
          modal_name: modalName,
          click_action: clickAction,
          modal_step: modalStep,
          ...metadata,
        }
      });

    if (error) {
      console.error('Error tracking modal click:', error);
    }
  } catch (err) {
    console.error('Error tracking modal click:', err);
  }
}
