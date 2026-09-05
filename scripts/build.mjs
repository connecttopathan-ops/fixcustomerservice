/** Regenerates every derived page. Run after editing content/posts/ or the audit copy. */
import { buildAudit } from './build-audit.mjs';
import { buildBlog } from './build-blog.mjs';

const audit = await buildAudit();
console.log('audit:', audit.replace(process.cwd() + '/', ''));
const posts = await buildBlog();
console.log(`blog: ${posts.length} post(s), sitemap + llms.txt + homepage block rewritten`);
