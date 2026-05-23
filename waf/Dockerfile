FROM owasp/modsecurity:nginx

COPY modsecurity.conf /etc/modsecurity/modsecurity.conf
COPY bypass-rules/ /etc/modsecurity/bypass-rules/

RUN for f in /etc/modsecurity/bypass-rules/*.conf; do \
      echo "Include $f" >> /etc/modsecurity/modsecurity.conf; \
    done

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
