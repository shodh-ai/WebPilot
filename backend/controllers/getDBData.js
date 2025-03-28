import supabase from '../config/supabase.js';
import { getDBData as getDBDataSchema } from '../schemas/getDBData.js';

function getQuery(query, index, tables, columns) {
  if (index === tables.length) {
    return "";
  }
  let temp = '';
  if (index + 1 !== tables.length) {
    temp = '!' + columns[index][0] + '(';
    columns[index] = columns[index].slice(1);
    temp += getQuery(query, index + 1, tables, columns);
    temp += ',';
  }else{
    temp = '(';
  }
  query = tables[index] + temp + columns[index].join(',') + ')';
  return query;
}

export async function getDBData(req, res) {
  try {
    const parsed = getDBDataSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    let {tables, columns } = parsed.data;
    let user_id = req.user.userId;
    if (!user_id) {
      return res.status(400).json({ error: 'User not found' });
    }
    let query = '';
    query = getQuery(query, 0, tables, columns);
    const { data: tableData, error: tableError } = await supabase
      .from('User')
      .select(query)
      .eq('user_id', user_id);
    if (tableError) {
      return res.status(400).json({ error: tableError.message });
    }
    return res.json({ message: 'Data fetched successfully', data: tableData });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
}
