'use strict';

function hotelPage() {
  const tab = view.route.split('/')[1] || 'general';
  const tabs = [
    ['general', 'Общая информация'],
    ['services', 'Услуги'],
    ['photos', 'Фотографии'],
    ['content', 'Для карточки'],
    ['preview', 'Предпросмотр'],
    ['contracts', 'Договоры'],
    ...(roleAdmin() ? [['staff', 'Сотрудники']] : [])
  ];
  const panels = {
    general: generalForm,
    services: servicesPage,
    photos: photosPage,
    content: contentPage,
    preview: previewPage,
    contracts: contractsPage,
    staff: staffPage
  };
  const navigation = tabs.map(([id, title]) => `
    <button class="tab ${tab === id ? 'active' : ''}"
      data-action="go:hotel/${id}" ${tab === id ? 'aria-current="page"' : ''}>
      ${title}
    </button>`).join('');
  const panel = tab === 'staff' && !roleAdmin()
    ? note('Управление сотрудниками доступно администратору отеля.')
    : (panels[tab] || generalForm)();

  return head(
    'Отель',
    'Информация, с которой начинается знакомство гостя с вашим отелем.',
    badge(canEdit() ? 'Данные можно редактировать' : 'Только просмотр', canEdit() ? 'pending' : '')
  ) + `<nav class="tabs" aria-label="Разделы отеля">${navigation}</nav>` + panel;
}

function generalForm() {
  const h = hotel();
  const f = h.form;
  const locked = !canEdit();
  const reception = f.reception === 'Круглосуточно' ? 'Круглосуточно' : 'По часам';
  const hasReceptionHours = reception === 'По часам';
  const hasPets = ['Бесплатно', 'Платно', 'Бесплатно и платно'].includes(h.services.pets);
  const needsDeposit = f.deposit === 'Требуется';
  const arrivalOptions = [
    ['', 'Выберите вариант'],
    ['Не требуется', 'Не требуется'],
    ['Требуется', 'Требуется']
  ].map(([value, label]) => `
    <option value="${value}" ${f.advanceArrival === value ? 'selected' : ''}>${label}</option>`).join('');

  return `
    ${locked ? `<div class="mb">${note('Для изменения опубликованных сведений напишите бэкофису. Официальный сайт можно обновить самостоятельно.', '', 'Info')}</div>` : ''}
    <div class="form-layout">
      <form id="general-form" class="card" novalidate>
        <div class="field-section">
          <h3>Об отеле</h3>
          <div class="form-grid">
            ${field('Название отеля', 'name', f.name, { required: true, disabled: locked, full: true, hint: 'Проверьте название, полученное из TravelLine.' })}
            ${field('Тип объекта', 'type', f.type, { required: true, disabled: locked, select: ['Гостиница', 'Апарт-отель', 'Бутик-отель'] })}
            ${field('Звёздность', 'stars', f.stars, { required: true, disabled: locked, select: ['4', '5'] })}
            ${field('Город', 'city', f.city, { required: true, disabled: locked })}
            ${field('Фактический адрес', 'address', f.address, { required: true, disabled: locked })}
          </div>
        </div>

        <div class="field-section">
          <h3>Контакты для гостей</h3>
          <div class="form-grid">
            ${field('Телефон', 'phone', f.phone, { required: true, disabled: locked, type: 'tel' })}
            ${field('Email для гостей', 'email', f.email, { required: true, disabled: locked, type: 'email' })}
            ${field('Официальный сайт', 'website', f.website, {
              required: true,
              full: true,
              type: 'url',
              placeholder: 'https://hotel.example',
              hint: 'Сайт и гостевая почта обязательны: они попадут в оферту и ваучер после раскрытия отеля.'
            })}
          </div>
        </div>

        <div class="field-section">
          <h3>Условия проживания</h3>
          <div class="form-grid">
            ${field('Стандартное время заезда', 'checkin', f.checkin, { required: true, disabled: locked, type: 'time' })}
            ${field('Стандартное время выезда', 'checkout', f.checkout, { required: true, disabled: locked, type: 'time' })}
            ${field('Стойка регистрации', 'reception', reception, {
              required: true,
              disabled: locked,
              full: true,
              select: ['Круглосуточно', 'По часам']
            })}

            <div class="full conditional-fields" data-condition="reception-hours" ${hasReceptionHours ? '' : 'hidden'}>
              <div class="form-grid">
                ${field('Часы работы стойки', 'receptionHours', f.receptionHours, {
                  required: true,
                  disabled: locked,
                  placeholder: 'Например, 07:00–23:00'
                })}
                <div class="field" data-field="advanceArrival">
                  <label for="f-advanceArrival">Предварительное согласование заезда <span class="req">*</span></label>
                  <select id="f-advanceArrival" name="advanceArrival" ${locked ? 'disabled' : ''}>
                    ${arrivalOptions}
                  </select>
                  <div class="hint">Для заселения вне часов работы стойки.</div>
                  <div class="error-text" hidden></div>
                </div>
                ${field('Как заселиться вне часов работы стойки', 'outsideArrival', f.outsideArrival, {
                  required: true,
                  disabled: locked,
                  full: true,
                  type: 'textarea',
                  hint: 'Опишите понятный гостю порядок действий и способ связи с отелем.'
                })}
              </div>
            </div>

            <div class="full conditional-fields" data-condition="pets" ${hasPets ? '' : 'hidden'}>
              ${field('Условия размещения с животными', 'petsConditions', f.petsConditions, {
                disabled: locked,
                full: true,
                type: 'textarea',
                hint: 'Укажите существенные ограничения: вес, количество животных и необходимость согласования.'
              })}
            </div>

            ${field('Страховой депозит', 'deposit', f.deposit || 'Не указано', {
              disabled: locked,
              full: true,
              select: ['Не указано', 'Не требуется', 'Требуется'],
              hint: 'Если условия пока неизвестны, оставьте «Не указано». Это не блокирует модерацию.'
            })}
            <div class="full conditional-fields" data-condition="deposit" ${needsDeposit ? '' : 'hidden'}>
              <div class="form-grid">
                ${field('Известная сумма депозита, ₽', 'depositAmount', f.depositAmount, {
                  disabled: locked,
                  type: 'number',
                  full: true,
                  hint: 'Оставьте пустым, если сумма пока неизвестна.'
                })}
                ${field('Внесение и возврат депозита', 'depositNotes', f.depositNotes, {
                  disabled: locked,
                  full: true,
                  type: 'textarea',
                  hint: 'Укажите известные условия: когда и как внести депозит, как и в какой срок его вернут.'
                })}
              </div>
            </div>

            ${field('Другие важные условия проживания', 'conditions', f.conditions, {
              disabled: locked,
              type: 'textarea',
              full: true,
              hint: 'То, что гость должен знать до бронирования. Условия детского размещения и стоимость завтрака определяются предложением TravelLine.'
            })}
          </div>
        </div>

        <div class="form-footer">
          <span class="saved">${icon('ShieldCheck', 13)} ${locked ? 'Официальный сайт доступен для редактирования' : 'Данные проверит бэкофис'}</span>
          <button class="btn primary" type="submit">${icon('Check', 17)}Сохранить изменения</button>
        </div>
      </form>

      <aside class="stack form-aside">
        <div class="help-card">
          ${icon('PlugZap', 22)}
          <h3>Часть сведений уже заполнена</h3>
          <p>Мы получили их из TravelLine. Вы можете исправить данные до активации. Ваши правки не будут потеряны при обновлении.</p>
        </div>
        <section class="card">
          <h3>Юридическое лицо</h3>
          <p class="tiny muted mt-sm">ООО «Демо Отель»</p>
          <div class="read-value mt-sm"><span>Данные ведёт</span><strong>Бэкофис</strong></div>
          <div class="mt-sm">${btn('Юридическое лицо и реквизиты', 'legal', 'outline small', 'FileText')}</div>
          <button class="text-link mt-sm tiny" data-action="go:hotel/contracts">Открыть договоры ${icon('ArrowUpRight', 14)}</button>
        </section>
        <section class="card">
          <h3>Сведения ФСА</h3>
          <p class="tiny muted mt-sm">Проверка реестра выполняется бэкофисом перед активацией.</p>
          ${badge(h.everActive ? 'Проверено' : 'На проверке', h.everActive ? 'good' : 'pending')}
        </section>
      </aside>
    </div>`;
}

function servicesPage() {
  const h = hotel();
  const locked = !canEdit();
  const cards = SERVICE_LIST.map(([id, name, serviceIcon, description]) => {
    const value = h.services[id] || 'Нет';
    const enabled = ['Бесплатно', 'Платно', 'Бесплатно и платно'].includes(value);
    const paid = ['Платно', 'Бесплатно и платно'].includes(value);
    let controls;

    if (id === 'parking') {
      const freeParking = ['Бесплатно', 'Бесплатно и платно'].includes(value);
      controls = `
        <label class="service-choice" for="parking-free">
          <input type="checkbox" id="parking-free" name="parking-free" ${freeParking ? 'checked' : ''} ${locked ? 'disabled' : ''}>
          <span>Бесплатная парковка</span>
        </label>
        <label class="service-choice" for="parking-paid">
          <input type="checkbox" id="parking-paid" name="parking-paid" ${paid ? 'checked' : ''} ${locked ? 'disabled' : ''}>
          <span>Платная парковка</span>
        </label>
        <span class="hint">Можно отметить оба варианта.</span>`;
    } else {
      controls = `
        <label class="service-choice" for="service-${id}">
          <input type="checkbox" id="service-${id}" name="service-${id}" data-service-toggle="${id}" ${enabled ? 'checked' : ''} ${locked ? 'disabled' : ''}>
          <span>Доступно гостям</span>
        </label>
        <label class="service-choice" for="paid-${id}">
          <input type="checkbox" id="paid-${id}" name="paid-${id}" data-service-paid="${id}" ${paid ? 'checked' : ''} ${locked || !enabled ? 'disabled' : ''}>
          <span>Платно</span>
        </label>
        <span class="hint">Без отметки «Платно» — бесплатно.</span>`;
    }

    const timeField = id === 'early' || id === 'late' ? `
      <div class="mt-sm" data-service-time="${id}" ${enabled ? '' : 'hidden'}>
        ${field(id === 'early' ? 'Ранний заезд возможен с' : 'Поздний выезд возможен до', `${id}-time`, h.serviceTimes?.[id] || '', {
          type: 'time',
          disabled: locked || !enabled,
          hint: 'Необязательно. Укажите время, если оно известно.'
        })}
      </div>` : '';

    return `
      <article class="service-card" data-service-card="${id}">
        <div class="service-icon">${icon(serviceIcon, 24)}</div>
        <h3>${esc(name)}</h3>
        <p>${esc(description)}</p>
        ${id === 'early' || id === 'late' ? badge('При наличии возможности', 'pending') : ''}
        <div class="service-controls">${controls}${timeField}</div>
      </article>`;
  }).join('');

  return `
    <div class="between mb">
      <div>
        <h2>То, что важно вашим гостям</h2>
        <p class="card-subtitle">Отметьте доступные услуги и их платность. Цены указывать не нужно.</p>
      </div>
    </div>
    ${locked ? `<div class="mb">${note('Опубликованные услуги изменяются через бэкофис.')}</div>` : ''}
    <form id="services-form">
      <div class="services-grid">${cards}</div>
      <div class="between mt">
        <span class="field-help">Если услуг нет, оставьте все отметки выключенными — это не мешает отправке на модерацию.</span>
        ${locked ? btn('Связаться с бэкофисом', 'support', 'outline', 'Mail') : '<button class="btn primary" type="submit">Сохранить услуги</button>'}
      </div>
    </form>`;
}

function contractsPage() {
  return `
    <div class="between mb">
      <div>
        <h2>Договоры и условия</h2>
        <p class="card-subtitle">Сотрудники отеля могут просматривать и скачивать документы. Условия и файлы добавляет бэкофис.</p>
      </div>
      ${badge('Демонстрационные данные', 'pending')}
    </div>
    <section class="card table-card">
      <div class="data-table-wrap">
        <table class="data-table">
          <thead><tr><th>Договор</th><th>Юридическое лицо</th><th>Сервисный сбор</th><th>Агентское вознаграждение</th><th>Состояние</th><th></th></tr></thead>
          <tbody>
            <tr>
              <td><strong>№ HI-2026-1048</strong><small>от 01.10.2026 · бессрочно</small></td>
              <td>ООО «Демо Отель»</td>
              <td><strong>13%</strong></td>
              <td>0,01%</td>
              <td>${badge('Действует', 'good')}</td>
              <td>${btn('Посмотреть', 'contract:current', 'outline small', 'Eye')}</td>
            </tr>
            <tr>
              <td><strong>№ HI-2026-0821</strong><small>01.08.2026 — 30.09.2026</small></td>
              <td>ООО «Демо Отель»</td>
              <td><strong>15%</strong></td>
              <td>0,01%</td>
              <td>${badge('Не действует')}</td>
              <td>${btn('Посмотреть', 'contract:old', 'outline small', 'Eye')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <div class="mt">${note('Прежние договоры доступны для просмотра. Состояние относится к выбранному отелю; исторические условия сохраняются.', '', 'FileText')}</div>`;
}

function contractModal(which) {
  const old = which === 'old';
  modal(
    `Договор № ${old ? 'HI-2026-0821' : 'HI-2026-1048'}`,
    'Демонстрационные документы и условия',
    `
      <div class="mb">${badge(old ? 'Не действует для этого отеля' : 'Действует', old ? '' : 'good')}</div>
      <div class="read-value"><span>Юридическое лицо</span><strong>ООО «Демо Отель»</strong></div>
      <div class="read-value"><span>Дата договора</span><strong>${old ? '01.08.2026' : '01.10.2026'}</strong></div>
      <div class="read-value"><span>Срок действия</span><strong>${old ? 'до 30.09.2026' : 'Бессрочно'}</strong></div>
      <div class="read-value"><span>Сервисный сбор</span><strong>${old ? '15' : '13'}%</strong></div>
      <div class="read-value"><span>Агентское вознаграждение</span><strong>0,01%</strong></div>
      <div class="mt">${btn('Юридическое лицо и реквизиты', 'legal', 'outline small', 'FileText')}</div>
      <div class="download-doc mt">
        ${icon('FileText', 26)}
        <div><strong>Образец договора</strong><small>Текстовый файл · демоданные без подписей</small></div>
      </div>
      <p class="tiny muted mt-sm">Документ доступен для просмотра и скачивания всем сотрудникам с доступом к отелю. Изменяет условия и файлы бэкофис.</p>`,
    btn('Скачать образец', `download-contract:${old ? 'old' : 'current'}`, 'primary', 'Download')
  );
}

function legalModal() {
  const rows = [
    ['Юридическое лицо', 'ООО «Демо Отель»'],
    ['ИНН', '0000000000'],
    ['КПП', '000000000'],
    ['ОГРН', '0000000000000'],
    ['Юридический адрес', 'Санкт-Петербург, Демонстрационный адрес, 12'],
    ['Банк', 'Демонстрационный банк'],
    ['БИК', '000000000'],
    ['Расчётный счёт', '00000000000000000000'],
    ['Корреспондентский счёт', '00000000000000000000']
  ].map(([label, value]) => `
    <div class="read-value"><span>${label}</span><strong>${value}</strong></div>`).join('');

  modal(
    'Юридическое лицо и реквизиты',
    'Текущие сведения выбранного отеля · только просмотр',
    `
      <div class="mb">${note('Демонстрационные реквизиты: название, адрес и все номера вымышлены. Они не подходят для платежей.', 'warning', 'Info')}</div>
      <div class="legal-details">${rows}</div>
      <p class="tiny muted mt">Сведения и банковские реквизиты ведёт бэкофис. Если заметили ошибку, свяжитесь с ним.</p>`,
    btn('Связаться с бэкофисом', 'support', 'outline', 'Mail')
  );
}
