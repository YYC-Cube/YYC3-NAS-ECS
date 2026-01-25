import React from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../contexts/ThemeContext';

interface TableColumn {
  key: string;
  label: string;
}

interface TableRow {
  [key: string]: string | number;
}

interface ModuleTableProps {
  columns: TableColumn[];
  data: TableRow[];
}

export const ModuleTable: React.FC<ModuleTableProps> = ({ columns, data }) => {
  const { currentTheme } = useTheme();

  // 根据主题获取浅色背景
  const getLightColor = () => {
    switch(currentTheme) {
      case 'cpu':
        return '#F0F7FF';
      case 'memory':
        return '#F0F9F4';
      case 'storage':
        return '#F8F0FF';
      case 'network':
        return '#FFF5EB';
      case 'security':
        return '#FFF0EE';
      default:
        return '#F0F7FF';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr 
            className="border-b-2"
            style={{ borderColor: 'var(--module-shadow)' }}
          >
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left"
                style={{ color: 'var(--module-primary)' }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <motion.tr
              key={index}
              className="border-b transition-all duration-200"
              style={{ 
                borderColor: 'rgba(var(--module-shadow), 0.2)',
                backgroundColor: 'transparent',
              }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{
                backgroundColor: `${getLightColor()}4D`, // 30% opacity in hex
              }}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-4 py-3"
                  style={{ color: 'var(--module-dark)' }}
                >
                  {row[column.key]}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};