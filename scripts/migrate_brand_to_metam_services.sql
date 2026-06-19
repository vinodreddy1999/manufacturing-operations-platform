DO $$
DECLARE
    column_record record;
    replacement_expression text;
BEGIN
    FOR column_record IN
        SELECT table_schema, table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND data_type IN ('character varying', 'character', 'text', 'json', 'jsonb')
    LOOP
        replacement_expression := format(
            'replace(replace(replace(%1$I::text, %2$L, %3$L), %4$L, %5$L), %6$L, %7$L)',
            column_record.column_name,
            'manufacturing-operations-platform',
            'metam-services',
            'MOP',
            'METAM',
            'mop',
            'metam'
        );

        IF column_record.data_type = 'jsonb' THEN
            replacement_expression := replacement_expression || '::jsonb';
        ELSIF column_record.data_type = 'json' THEN
            replacement_expression := replacement_expression || '::json';
        END IF;

        EXECUTE format(
            'UPDATE %1$I.%2$I SET %3$I = %4$s WHERE %3$I::text LIKE %5$L OR %3$I::text LIKE %6$L',
            column_record.table_schema,
            column_record.table_name,
            column_record.column_name,
            replacement_expression,
            '%mop%',
            '%MOP%'
        );
    END LOOP;
END $$;
