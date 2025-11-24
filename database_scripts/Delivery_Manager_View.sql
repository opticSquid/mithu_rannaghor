CREATE OR REPLACE VIEW MANAGER_DELIVERY_VIEW AS
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

-- ===============================
-- MONTHLY SUBSCRIBERS
-- ===============================
monthly_deliveries AS (
    SELECT
        u.USER_ID,
        u.NAME,
        u.MOBILE_NO,
        u.BUILDING_NO,
        u.ROOM_NO,
        m.WEEKDAY,
        m.MENU_TYPE AS SHIFT,
        m.FOOD_CLASS,
        m.ITEM_ID,
        p.NAME AS ITEM_NAME
    FROM today_day td
    JOIN USER_PREFERENCES up
        ON up.WEEKDAY = td.weekday_enum
    JOIN USERS u
        ON u.USER_ID = up.USER_ID
        AND u.plan = 'monthly'
    JOIN WALLET w
        ON w.USER_ID = u.USER_ID
        AND w.BALANCE > 0
    JOIN MENU m
        ON m.WEEKDAY = td.weekday_enum
        AND m.FOOD_CLASS = up.PREF
    JOIN PRODUCTS p
        ON p.ITEM_ID = m.ITEM_ID
    LEFT JOIN USER_SKIP us
        ON us.USER_ID = u.USER_ID
        AND us.SKIP_DATE = CURRENT_DATE
        AND us.SHIFT = m.MENU_TYPE
    WHERE us.USER_ID IS NULL     -- not skipped
),

-- ===============================
-- ONE-OFF CUSTOMERS
-- ===============================
oneoff_deliveries AS (
    SELECT
        u.USER_ID,
        u.NAME,
        u.MOBILE_NO,
        u.BUILDING_NO,
        u.ROOM_NO,
        o.WEEKDAY,
        o.SHIFT,
        prod.FOOD_CLASS,
        o.ITEM_ID,
        prod.NAME AS ITEM_NAME
    FROM today_day td
    JOIN ONE_OFF_ORDERS o
        ON o.WEEKDAY = td.weekday_enum
    JOIN USERS u
        ON u.USER_ID = o.USER_ID
        AND u.plan = 'one_off'
    JOIN PRODUCTS prod
        ON prod.ITEM_ID = o.ITEM_ID
)

-- ===============================
-- FINAL OUTPUT
-- ===============================
SELECT *
FROM (
    SELECT * FROM monthly_deliveries
    UNION ALL
    SELECT * FROM oneoff_deliveries
) d
ORDER BY d.SHIFT, d.BUILDING_NO, d.ROOM_NO;
