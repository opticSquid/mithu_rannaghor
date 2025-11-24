CREATE OR REPLACE VIEW CHEF_PREP_VIEW AS
WITH today_day AS (
    SELECT (
        CASE EXTRACT(DOW FROM CURRENT_DATE)
            WHEN 0 THEN 'sunday'
            WHEN 1 THEN 'monday'
            WHEN 2 THEN 'tuesday'
            WHEN 3 THEN 'wednesday'
            WHEN 4 THEN 'thursday'
            WHEN 5 THEN 'friday'
            WHEN 6 THEN 'saturday'
        END
    )::DAY AS weekday_enum
),
-- ================================
-- Monthly subscriber orders
-- ================================
monthly_orders AS (
    SELECT
        m.WEEKDAY,
        m.MENU_TYPE AS SHIFT,
        m.FOOD_CLASS,
        m.ITEM_ID,
        1 AS qty
    FROM today_day td
    JOIN MENU m
        ON m.WEEKDAY = td.weekday_enum
    JOIN USER_PREFERENCES up
        ON up.WEEKDAY = td.weekday_enum
        AND up.PREF = m.FOOD_CLASS
    JOIN USERS u
        ON u.USER_ID = up.USER_ID
        AND u.plan = 'monthly'
    JOIN WALLET w
        ON w.USER_ID = u.USER_ID
        AND w.BALANCE > 0
    LEFT JOIN USER_SKIP us
        ON us.USER_ID = u.USER_ID
        AND us.SKIP_DATE = CURRENT_DATE
        AND us.SHIFT = m.MENU_TYPE
    WHERE us.USER_ID IS NULL   -- has NOT skipped
),
-- ================================
-- One-off customer orders
-- ================================
oneoff_orders AS (
    SELECT
        o.WEEKDAY,
        o.SHIFT,
        p.FOOD_CLASS,
        o.ITEM_ID,
        1 AS qty
    FROM today_day td
    JOIN ONE_OFF_ORDERS o
        ON o.WEEKDAY = td.weekday_enum
    JOIN PRODUCTS p
        ON p.ITEM_ID = o.ITEM_ID
)
-- ================================
-- Final consolidated output
-- ================================
SELECT
    WEEKDAY,
    SHIFT,
    FOOD_CLASS,
    ITEM_ID,
    (SELECT NAME FROM PRODUCTS WHERE ITEM_ID = t.ITEM_ID) AS ITEM_NAME,
    SUM(qty) AS TOTAL_QUANTITY
FROM (
    SELECT * FROM monthly_orders
    UNION ALL
    SELECT * FROM oneoff_orders
) t
GROUP BY
    WEEKDAY, SHIFT, FOOD_CLASS, ITEM_ID;
