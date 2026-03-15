-- Protected price calculation function (backend-only, never exposed to frontend)
-- This function hides the pricing algorithm from the frontend
CREATE OR REPLACE FUNCTION calculate_card_price(card_color TEXT, card_quantity INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  price_per_card INT;
BEGIN
  -- Hardcoded pricing algorithm (protected from frontend exposure)
  price_per_card := CASE
    WHEN card_color = 'red' THEN 20
    WHEN card_color = 'white' THEN 50
    WHEN card_color = 'sky' THEN 100
    WHEN card_color = 'blue' THEN 150
    WHEN card_color = 'black' THEN 200
    ELSE 0
  END;

  RETURN price_per_card * card_quantity;
END;
$$;
