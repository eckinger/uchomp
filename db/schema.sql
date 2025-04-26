                                          List of relations
 Schema |    Name     | Type  |    Owner     | Persistence | Access method |    Size    | Description 
--------+-------------+-------+--------------+-------------+---------------+------------+-------------
 public | code        | table | neondb_owner | permanent   | heap          | 8192 bytes | 
 public | food_order  | table | neondb_owner | permanent   | heap          | 0 bytes    | 
 public | order_group | table | neondb_owner | permanent   | heap          | 0 bytes    | 
 public | user        | table | neondb_owner | permanent   | heap          | 8192 bytes | 
(4 rows)

                                       List of schemas
  Name  |       Owner       |           Access privileges            |      Description       
--------+-------------------+----------------------------------------+------------------------
 public | pg_database_owner | pg_database_owner=UC/pg_database_owner+| standard public schema
        |                   | =U/pg_database_owner                   | 
(1 row)

                                                                           List of functions
 Schema | Name | Result data type | Argument data types | Type | Volatility | Parallel | Owner | Security | Access privileges | Language | Internal name | Description 
--------+------+------------------+---------------------+------+------------+----------+-------+----------+-------------------+----------+---------------+-------------
(0 rows)

                                             List of data types
 Schema | Name | Internal name | Size |      Elements       |    Owner     | Access privileges | Description 
--------+------+---------------+------+---------------------+--------------+-------------------+-------------
 public | locs | locs          | 4    | Regenstein Library +| neondb_owner |                   | 
        |      |               |      | Harper Library     +|              |                   | 
        |      |               |      | John Crerar Library |              |                   | 
(1 row)

